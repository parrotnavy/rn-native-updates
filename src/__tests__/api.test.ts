import { Linking, Platform } from 'react-native';
import {
  checkPlayStoreUpdate,
  completeInAppUpdate,
  getCountry,
  getCurrentBuildNumber,
  getCurrentVersion,
  getLatestVersion,
  getPackageName,
  getStoreUrl,
  needUpdate,
  openStore,
  startInAppUpdate,
} from '../api';
import { NativeUpdatesModule } from '../NativeUpdatesModule';

jest.mock('react-native', () => ({
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
  },
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
}));

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
  },
}));

const mockModule = NativeUpdatesModule as jest.Mocked<typeof NativeUpdatesModule>;

describe('API - Sync Functions', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
  });

  describe('getPackageName', () => {
    it('returns package name from native module', () => {
      expect(getPackageName()).toBe('com.test.app');
    });
  });

  describe('getCurrentVersion', () => {
    it('returns current version from native module', () => {
      expect(getCurrentVersion()).toBe('1.0.0');
    });
  });

  describe('getCurrentBuildNumber', () => {
    it('returns build number from native module', () => {
      expect(getCurrentBuildNumber()).toBe(1);
    });
  });

  describe('getCountry', () => {
    it('returns country from native module', () => {
      expect(getCountry()).toBe('us');
    });
  });
});

describe('API - Async Functions (iOS)', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
    jest.clearAllMocks();
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
  });

  describe('getLatestVersion', () => {
    it('returns version from App Store info', async () => {
      mockModule.getAppStoreVersion.mockResolvedValue({
        version: '2.0.0',
        trackId: 123456,
        trackViewUrl: 'https://apps.apple.com/app/id123456',
        currentVersionReleaseDate: '2024-01-01',
        releaseNotes: 'Bug fixes',
        minimumOsVersion: '14.0',
      });

      const version = await getLatestVersion();
      expect(version).toBe('2.0.0');
      expect(mockModule.getAppStoreVersion).toHaveBeenCalledWith(null, false);
    });

    it('respects country option', async () => {
      mockModule.getAppStoreVersion.mockResolvedValue({
        version: '2.0.0',
        trackId: 123456,
        trackViewUrl: 'https://apps.apple.com/kr/app/id123456',
        currentVersionReleaseDate: '2024-01-01',
        releaseNotes: null,
        minimumOsVersion: '14.0',
      });

      await getLatestVersion({ country: 'kr' });
      expect(mockModule.getAppStoreVersion).toHaveBeenCalledWith('kr', false);
    });

    it('respects forceRefresh option', async () => {
      mockModule.getAppStoreVersion.mockResolvedValue({
        version: '2.0.0',
        trackId: 123456,
        trackViewUrl: 'https://apps.apple.com/app/id123456',
        currentVersionReleaseDate: '2024-01-01',
        releaseNotes: null,
        minimumOsVersion: '14.0',
      });

      await getLatestVersion({ forceRefresh: true });
      expect(mockModule.getAppStoreVersion).toHaveBeenCalledWith(null, true);
    });
  });

  describe('needUpdate', () => {
    it('returns isNeeded: true when update available', async () => {
      mockModule.getAppStoreVersion.mockResolvedValue({
        version: '2.0.0',
        trackId: 123456,
        trackViewUrl: 'https://apps.apple.com/app/id123456',
        currentVersionReleaseDate: '2024-01-01',
        releaseNotes: null,
        minimumOsVersion: '14.0',
      });

      const result = await needUpdate();
      expect(result.isNeeded).toBe(true);
      expect(result.currentVersion).toBe('1.0.0');
      expect(result.latestVersion).toBe('2.0.0');
    });

    it('returns isNeeded: false when no update', async () => {
      mockModule.getAppStoreVersion.mockResolvedValue({
        version: '1.0.0',
        trackId: 123456,
        trackViewUrl: 'https://apps.apple.com/app/id123456',
        currentVersionReleaseDate: '2024-01-01',
        releaseNotes: null,
        minimumOsVersion: '14.0',
      });

      const result = await needUpdate();
      expect(result.isNeeded).toBe(false);
    });

    it('uses provided currentVersion', async () => {
      mockModule.getAppStoreVersion.mockResolvedValue({
        version: '2.0.0',
        trackId: 123456,
        trackViewUrl: 'https://apps.apple.com/app/id123456',
        currentVersionReleaseDate: '2024-01-01',
        releaseNotes: null,
        minimumOsVersion: '14.0',
      });

      const result = await needUpdate({ currentVersion: '1.9.0' });
      expect(result.currentVersion).toBe('1.9.0');
      expect(result.isNeeded).toBe(true);
    });

    it('uses provided latestVersion', async () => {
      mockModule.getAppStoreVersion.mockResolvedValue({
        version: '2.0.0',
        trackId: 123456,
        trackViewUrl: 'https://apps.apple.com/app/id123456',
        currentVersionReleaseDate: '2024-01-01',
        releaseNotes: null,
        minimumOsVersion: '14.0',
      });

      const result = await needUpdate({ latestVersion: '0.9.0' });
      expect(result.latestVersion).toBe('0.9.0');
      expect(result.isNeeded).toBe(false);
    });

    it('respects depth option', async () => {
      mockModule.getAppStoreVersion.mockResolvedValue({
        version: '1.0.1',
        trackId: 123456,
        trackViewUrl: 'https://apps.apple.com/app/id123456',
        currentVersionReleaseDate: '2024-01-01',
        releaseNotes: null,
        minimumOsVersion: '14.0',
      });

      const result = await needUpdate({ depth: 2 });
      expect(result.isNeeded).toBe(false);
    });
  });

  describe('openStore', () => {
    it('opens URL when supported', async () => {
      mockModule.getAppStoreVersion.mockResolvedValue({
        version: '2.0.0',
        trackId: 123456,
        trackViewUrl: 'https://apps.apple.com/app/id123456',
        currentVersionReleaseDate: '2024-01-01',
        releaseNotes: null,
        minimumOsVersion: '14.0',
      });

      await openStore();
      expect(Linking.openURL).toHaveBeenCalledWith('https://apps.apple.com/app/id123456');
    });

    it('throws when URL cannot be opened', async () => {
      mockModule.getAppStoreVersion.mockResolvedValue({
        version: '2.0.0',
        trackId: 123456,
        trackViewUrl: 'invalid-url',
        currentVersionReleaseDate: '2024-01-01',
        releaseNotes: null,
        minimumOsVersion: '14.0',
      });

      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      await expect(openStore()).rejects.toThrow('Cannot open store URL');
    });
  });

  describe('getStoreUrl fallback', () => {
    it('throws wrapped error when getAppStoreVersion fails', async () => {
      mockModule.getAppStoreVersion.mockRejectedValue(new Error('Network error'));
      await expect(getStoreUrl()).rejects.toThrow('Failed to get store URL');
    });
  });
});

describe('API - Async Functions (Android)', () => {
  beforeEach(() => {
    Platform.OS = 'android';
    jest.clearAllMocks();
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    mockModule.checkPlayStoreUpdate = jest.fn();
    mockModule.startUpdate = jest.fn();
    mockModule.completeUpdate = jest.fn();
  });

  describe('getLatestVersion', () => {
    it('returns availableVersionCode when update available', async () => {
      (mockModule.checkPlayStoreUpdate as jest.Mock).mockResolvedValue({
        updateAvailability: 2,
        availableVersionCode: 100,
      });

      const version = await getLatestVersion();
      expect(version).toBe('100');
    });

    it('returns currentVersion when no update', async () => {
      (mockModule.checkPlayStoreUpdate as jest.Mock).mockResolvedValue({
        updateAvailability: 1,
        availableVersionCode: null,
      });

      const version = await getLatestVersion();
      expect(version).toBe('1.0.0');
    });
  });

  describe('needUpdate', () => {
    it('uses buildNumber for currentVersion comparison', async () => {
      (mockModule.checkPlayStoreUpdate as jest.Mock).mockResolvedValue({
        updateAvailability: 2,
        availableVersionCode: 2,
      });

      const result = await needUpdate();
      expect(result.isNeeded).toBe(true);
      expect(result.currentVersion).toBe('1');
      expect(result.latestVersion).toBe('2');
    });
  });

  describe('Android-specific APIs', () => {
    it('checkPlayStoreUpdate calls native module', async () => {
      await checkPlayStoreUpdate();
      expect(mockModule.checkPlayStoreUpdate).toHaveBeenCalled();
    });

    it('startInAppUpdate calls native module', async () => {
      await startInAppUpdate(0);
      expect(mockModule.startUpdate).toHaveBeenCalledWith(0);
    });

    it('completeInAppUpdate calls native module', async () => {
      completeInAppUpdate();
      expect(mockModule.completeUpdate).toHaveBeenCalled();
    });
  });
});
