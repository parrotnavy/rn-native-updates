import { renderHook, waitFor } from '@testing-library/react-native';
import { Linking, Platform } from 'react-native';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { NativeUpdatesModule } from '../NativeUpdatesModule';
import { AppUpdateErrorCode, UpdateAvailability } from '../types';

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return {
    ...actual,
    Linking: {
      canOpenURL: jest.fn(),
      openURL: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios),
    },
  };
});

jest.mock('../NativeUpdatesModule', () => ({
  NativeUpdatesModule: {
    currentVersion: '1.0.0',
    buildNumber: '1',
    packageName: 'com.test.app',
    country: 'us',
    getAppStoreVersion: jest.fn(),
    checkPlayStoreUpdate: jest.fn(),
    startUpdate: jest.fn(),
    completeUpdate: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

const mockModule = NativeUpdatesModule as jest.Mocked<typeof NativeUpdatesModule>;

describe('useAppUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Android', () => {
    beforeEach(() => {
      Platform.OS = 'android';
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    });

    it('checks for update on mount if checkOnMount is true', async () => {
      mockModule.checkPlayStoreUpdate.mockResolvedValue({
        updateAvailability: UpdateAvailability.UPDATE_AVAILABLE,
        availableVersionCode: 100,
        isFlexibleUpdateAllowed: true,
        isImmediateUpdateAllowed: true,
        clientVersionStalenessDays: 0,
        updatePriority: 0,
        totalBytesToDownload: 1000,
        packageName: 'com.test.app',
      });

      const { result } = renderHook(() => useAppUpdate({ checkOnMount: true }));

      expect(result.current.isChecking).toBe(true);

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(result.current.isUpdateAvailable).toBe(true);
      expect(result.current.latestVersion).toBe('100');
      expect(result.current.playStoreInfo).not.toBeNull();
    });

    it('handles check error gracefully', async () => {
      mockModule.checkPlayStoreUpdate.mockRejectedValue(new Error('Network error'));

      const onError = jest.fn();
      const { result } = renderHook(() => useAppUpdate({ checkOnMount: true, onError }));

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AppUpdateErrorCode.CHECK_FAILED,
        }),
      );
      expect(result.current.error).not.toBeNull();
    });
  });

  describe('iOS', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    });

    it('checks for update using App Store', async () => {
      mockModule.getAppStoreVersion.mockResolvedValue({
        version: '2.0.0',
        trackId: 123456,
        trackViewUrl: 'https://example.com',
        currentVersionReleaseDate: '',
        releaseNotes: '',
        minimumOsVersion: '12.0',
      });

      const { result } = renderHook(() => useAppUpdate({ checkOnMount: true }));

      await waitFor(() => {
        expect(result.current.isUpdateAvailable).toBe(true);
      });

      expect(result.current.latestVersion).toBe('2.0.0');
    });
  });
});
