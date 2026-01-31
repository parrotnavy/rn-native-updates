import { NativeModules } from 'react-native';

import type { NativeUpdatesModuleType } from './types';

const { NativeUpdates } = NativeModules;

if (!NativeUpdates) {
  throw new Error(
    '[@parrotnavy/rn-native-updates] NativeUpdates module is not available. ' +
      'Make sure the library is properly linked. ' +
      'For bare React Native: run `npx pod-install` (iOS) after installing. ' +
      'For Expo: use a development build (`npx expo run:ios` or `npx expo run:android`).',
  );
}

export const NativeUpdatesModule = NativeUpdates as NativeUpdatesModuleType;
