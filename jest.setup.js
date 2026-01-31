const Platform = {
  OS: 'ios',
  select: (obj) => obj.ios ?? obj.default,
};

const Linking = {
  canOpenURL: jest.fn().mockResolvedValue(true),
  openURL: jest.fn().mockResolvedValue(undefined),
};

const NativeModules = {
  NativeUpdates: {
    currentVersion: '1.0.0',
    buildNumber: '1',
    packageName: 'com.test.app',
    country: 'us',
    getAppStoreVersion: jest.fn(),
    checkPlayStoreUpdate: jest.fn(),
    startUpdate: jest.fn(),
    completeUpdate: jest.fn(),
  },
};

const NativeEventEmitter = jest.fn().mockImplementation(() => ({
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeAllListeners: jest.fn(),
}));

module.exports = { Platform, Linking, NativeModules, NativeEventEmitter };
