import { NativeModules } from 'react-native';

import type { NativeUpdatesModuleType } from './types';

const LINKING_ERROR =
  '[@parrotnavy/rn-native-updates] NativeUpdates module is not available. ' +
  'Make sure the library is properly linked. ' +
  'For bare React Native: run `npx pod-install` (iOS) after installing. ' +
  'For Expo: use a development build (`npx expo run:ios` or `npx expo run:android`).';

// Try to load via TurboModuleRegistry first (New Architecture)
// Fall back to NativeModules (Old Architecture)
let NativeUpdates: NativeUpdatesModuleType | null = null;

try {
  // Attempt to use TurboModule (New Architecture)
  // Use dynamic import to avoid compile errors on older RN versions
  // biome-ignore lint/suspicious/noExplicitAny: global.__turboModuleProxy is not typed
  const isTurboModuleEnabled = (global as any).__turboModuleProxy != null;

  if (isTurboModuleEnabled) {
    try {
      const NativeNativeUpdates = require('./NativeNativeUpdates').default;
      NativeUpdates = NativeNativeUpdates;
    } catch {
      // TurboModule not available, will fall back to NativeModules
    }
  }
} catch {
  // TurboModuleRegistry not available
}

// Fall back to NativeModules (Old Architecture)
if (!NativeUpdates) {
  NativeUpdates = NativeModules.NativeUpdates;
}

if (!NativeUpdates) {
  throw new Error(LINKING_ERROR);
}

export const NativeUpdatesModule = NativeUpdates as NativeUpdatesModuleType;
