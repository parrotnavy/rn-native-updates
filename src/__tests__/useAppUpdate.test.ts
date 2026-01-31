import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import * as api from '../api';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { AppUpdateError, AppUpdateErrorCode, UpdateAvailability } from '../types';

jest.mock('react-native', () => ({
  Linking: {
    canOpenURL: jest.fn().mockResolvedValue(true),
    openURL: jest.fn().mockResolvedValue(undefined),
  },
  Platform: {
    OS: 'ios',
    select: jest.fn((obj: Record<string, unknown>) => obj.ios ?? obj.default),
  },
}));

jest.mock('../NativeUpdatesModule', () => ({
  NativeUpdatesModule: {
    currentVersion: '1.0.0',
    buildNumber: '10',
    packageName: 'com.test.app',
    country: 'us',
    getAppStoreVersion: jest.fn(),
    checkPlayStoreUpdate: jest.fn(),
    startUpdate: jest.fn(),
    completeUpdate: jest.fn(),
  },
}));

describe('useAppUpdate - iOS', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
    jest.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useAppUpdate());

    expect(result.current.isChecking).toBe(false);
    expect(result.current.isUpdateAvailable).toBe(false);
    expect(result.current.currentVersion).toBe('1.0.0');
    expect(result.current.latestVersion).toBeNull();
    expect(result.current.storeUrl).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('checkUpdate sets state from needUpdate result', async () => {
    jest.spyOn(api, 'needUpdate').mockResolvedValue({
      isNeeded: true,
      currentVersion: '1.0.0',
      latestVersion: '2.0.0',
      storeUrl: 'https://apps.apple.com/app/id123',
    });

    const { result } = renderHook(() => useAppUpdate());

    await act(async () => {
      await result.current.checkUpdate();
    });

    expect(result.current.isUpdateAvailable).toBe(true);
    expect(result.current.latestVersion).toBe('2.0.0');
    expect(result.current.storeUrl).toBe('https://apps.apple.com/app/id123');
    expect(result.current.isChecking).toBe(false);
  });

  it('checkUpdate sets error on failure', async () => {
    const err = new AppUpdateError(AppUpdateErrorCode.NETWORK_ERROR, 'timeout');
    jest.spyOn(api, 'needUpdate').mockRejectedValue(err);
    const onError = jest.fn();

    const { result } = renderHook(() => useAppUpdate({ onError }));

    await act(async () => {
      await result.current.checkUpdate();
    });

    expect(result.current.error).toBe(err);
    expect(onError).toHaveBeenCalledWith(err);
    expect(result.current.isChecking).toBe(false);
  });

  it('wraps non-AppUpdateError into AppUpdateError', async () => {
    jest.spyOn(api, 'needUpdate').mockRejectedValue(new Error('raw'));
    const onError = jest.fn();

    const { result } = renderHook(() => useAppUpdate({ onError }));

    await act(async () => {
      await result.current.checkUpdate();
    });

    expect(result.current.error).toBeInstanceOf(AppUpdateError);
    expect(result.current.error?.code).toBe(AppUpdateErrorCode.CHECK_FAILED);
  });

  it('checkOnMount triggers checkUpdate', async () => {
    const spy = jest.spyOn(api, 'needUpdate').mockResolvedValue({
      isNeeded: false,
      currentVersion: '1.0.0',
      latestVersion: '1.0.0',
      storeUrl: 'https://apps.apple.com/app/id123',
    });

    renderHook(() => useAppUpdate({ checkOnMount: true }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
  });
});

describe('useAppUpdate - Android', () => {
  beforeEach(() => {
    Platform.OS = 'android';
    jest.clearAllMocks();
  });

  it('checkUpdate uses checkPlayStoreUpdate directly', async () => {
    jest.spyOn(api, 'checkPlayStoreUpdate').mockResolvedValue({
      updateAvailability: UpdateAvailability.UPDATE_AVAILABLE,
      availableVersionCode: 20,
      isFlexibleUpdateAllowed: true,
      isImmediateUpdateAllowed: true,
      clientVersionStalenessDays: null,
      updatePriority: 0,
      totalBytesToDownload: 0,
      packageName: 'com.test.app',
    });
    const needSpy = jest.spyOn(api, 'needUpdate');

    const { result } = renderHook(() => useAppUpdate());

    await act(async () => {
      await result.current.checkUpdate();
    });

    expect(needSpy).not.toHaveBeenCalled();
    expect(result.current.isUpdateAvailable).toBe(true);
    expect(result.current.latestVersion).toBe('20');
    expect(result.current.storeUrl).toBe(
      'https://play.google.com/store/apps/details?id=com.test.app',
    );
    expect(result.current.playStoreInfo?.updateAvailability).toBe(
      UpdateAvailability.UPDATE_AVAILABLE,
    );
  });

  it('sets build number as latestVersion when no update', async () => {
    jest.spyOn(api, 'checkPlayStoreUpdate').mockResolvedValue({
      updateAvailability: UpdateAvailability.UPDATE_NOT_AVAILABLE,
      availableVersionCode: null,
      isFlexibleUpdateAllowed: false,
      isImmediateUpdateAllowed: false,
      clientVersionStalenessDays: null,
      updatePriority: 0,
      totalBytesToDownload: 0,
      packageName: 'com.test.app',
    });

    const { result } = renderHook(() => useAppUpdate());

    await act(async () => {
      await result.current.checkUpdate();
    });

    expect(result.current.isUpdateAvailable).toBe(false);
    expect(result.current.latestVersion).toBe('10');
  });

  it('handles Play Store check failure', async () => {
    const err = new AppUpdateError(AppUpdateErrorCode.NOT_FROM_PLAY_STORE, 'sideloaded');
    jest.spyOn(api, 'checkPlayStoreUpdate').mockRejectedValue(err);
    const onError = jest.fn();

    const { result } = renderHook(() => useAppUpdate({ onError }));

    await act(async () => {
      await result.current.checkUpdate();
    });

    expect(result.current.error).toBe(err);
    expect(result.current.isUpdateAvailable).toBe(false);
    expect(onError).toHaveBeenCalledWith(err);
  });
});

describe('useAppUpdate - openStore error', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
    jest.clearAllMocks();
  });

  it('surfaces openStore errors', async () => {
    const err = new AppUpdateError(AppUpdateErrorCode.UNKNOWN, 'cannot open');
    jest.spyOn(api, 'openStore').mockRejectedValue(err);
    const onError = jest.fn();

    const { result } = renderHook(() => useAppUpdate({ onError }));

    await act(async () => {
      await result.current.openStore();
    });

    expect(result.current.error).toBe(err);
    expect(onError).toHaveBeenCalledWith(err);
  });

  it('wraps non-AppUpdateError in openStore', async () => {
    jest.spyOn(api, 'openStore').mockRejectedValue(new Error('raw'));
    const onError = jest.fn();

    const { result } = renderHook(() => useAppUpdate({ onError }));

    await act(async () => {
      await result.current.openStore();
    });

    expect(result.current.error).toBeInstanceOf(AppUpdateError);
    expect(result.current.error?.code).toBe(AppUpdateErrorCode.UNKNOWN);
  });
});
