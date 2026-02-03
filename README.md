# RN Native Updates

[![mit licence](https://img.shields.io/dub/l/vibe-d.svg?style=for-the-badge)](https://github.com/parrotnavy/rn-native-updates/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/@parrotnavy/rn-native-updates?style=for-the-badge)](https://www.npmjs.com/package/@parrotnavy/rn-native-updates)
[![npm downloads](https://img.shields.io/npm/dt/@parrotnavy/rn-native-updates.svg?label=downloads&style=for-the-badge)](https://www.npmjs.com/package/@parrotnavy/rn-native-updates)

[![platform - android](https://img.shields.io/badge/platform-Android-3ddc84.svg?logo=android&style=for-the-badge)](https://www.android.com)
[![platform - ios](https://img.shields.io/badge/platform-iOS-000.svg?logo=apple&style=for-the-badge)](https://developer.apple.com/ios)

[한국어](./README.ko.md)

React Native app update checker with hooks support. Uses Play Core In-App Updates for Android and iTunes Lookup API for iOS.

## Features

- **Hook API** - `useAppUpdate()` for easy integration with React components
- **Function API** - Compatible with `react-native-version-check` API style
- **Android In-App Updates** - Flexible and Immediate update flows via Play Core
- **iOS App Store Check** - Version lookup via iTunes API with caching
- **TypeScript** - Full type definitions included
- **Expo & Bare RN** - Works with both Expo and bare React Native projects

## Installation

```bash
npm install @parrotnavy/rn-native-updates
# or
yarn add @parrotnavy/rn-native-updates
```

### iOS Setup

```bash
cd ios && pod install
```

### Android Setup

No additional setup required. The library uses Play Core which is bundled automatically.

> **Note**: Android In-App Updates only work for apps installed from the Google Play Store.

## Usage

### Hook API (Recommended)

```tsx
import { useAppUpdate, UpdateType } from '@parrotnavy/rn-native-updates';

function UpdateChecker() {
  const {
    isChecking,
    isUpdateAvailable,
    currentVersion,
    latestVersion,
    checkUpdate,
    openStore,
    startUpdate,    // Android only
    completeUpdate, // Android only
  } = useAppUpdate({
    checkOnMount: true,
    onError: (error) => console.log('Update check failed:', error),
  });

  if (isUpdateAvailable) {
    return (
      <View>
        <Text>Update available: {latestVersion}</Text>
        <Button title="Update Now" onPress={() => startUpdate(UpdateType.IMMEDIATE)} />
      </View>
    );
  }

  return <Text>You're on the latest version: {currentVersion}</Text>;
}
```

### Function API

```ts
import {
  getCurrentVersion,
  getLatestVersion,
  needUpdate,
  openStore,
} from '@parrotnavy/rn-native-updates';

// Get current installed version
const version = getCurrentVersion(); // "1.0.0"

// Check latest version from store
const latest = await getLatestVersion(); // "1.1.0"

// Check if update is needed
const result = await needUpdate();
// { isNeeded: true, currentVersion: "1.0.0", latestVersion: "1.1.0", storeUrl: "..." }

// Open store page
await openStore();
```

## API Reference

### Hook: `useAppUpdate(options?)`

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `checkOnMount` | `boolean` | `false` | Automatically check for updates when component mounts |
| `country` | `string` | Device locale | Country code for App Store lookup (iOS only) |
| `onError` | `(error: AppUpdateError) => void` | - | Error callback |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `isChecking` | `boolean` | Whether an update check is in progress |
| `isUpdateAvailable` | `boolean` | Whether an update is available |
| `currentVersion` | `string` | Current installed version |
| `latestVersion` | `string \| null` | Latest version available (null if not checked) |
| `storeUrl` | `string \| null` | Store URL for the app |
| `error` | `AppUpdateError \| null` | Last error that occurred |
| `isDownloading` | `boolean` | Android: Whether update is downloading |
| `downloadProgress` | `number` | Android: Download progress (0-100) |
| `isReadyToInstall` | `boolean` | Android: Whether download is complete |
| `playStoreInfo` | `PlayStoreUpdateInfo \| null` | Android: Detailed Play Store info |
| `checkUpdate` | `() => Promise<void>` | Check for updates |
| `openStore` | `() => Promise<void>` | Open store page |
| `startUpdate` | `(type: UpdateType) => Promise<void>` | Android: Start in-app update |
| `completeUpdate` | `() => Promise<void>` | Android: Complete flexible update |

### Functions

#### `getCurrentVersion(): string`
Returns the current installed app version.

#### `getCurrentBuildNumber(): number`
Returns the current build number.

#### `getPackageName(): string`
Returns the bundle ID (iOS) or package name (Android).

#### `getCountry(): string`
Returns the device's country code.

#### `getLatestVersion(options?): Promise<string>`
Fetches the latest version from the store.

| Option | Type | Description |
|--------|------|-------------|
| `forceRefresh` | `boolean` | Bypass cache (iOS only) |
| `country` | `string` | Country code (iOS only) |

#### `needUpdate(options?): Promise<NeedUpdateResult>`
Checks if an update is needed.

| Option | Type | Description |
|--------|------|-------------|
| `currentVersion` | `string` | Version to compare (defaults to installed) |
| `latestVersion` | `string` | Latest version (fetches if not provided) |
| `depth` | `number` | Version comparison depth (1=major, 2=major.minor, etc.) |
| `forceRefresh` | `boolean` | Bypass cache (iOS only) |
| `country` | `string` | Country code (iOS only) |

#### `openStore(options?): Promise<void>`
Opens the store page for your app.

#### `getAppStoreInfo(options?): Promise<AppStoreInfo>` (iOS only)
Returns detailed App Store information.

#### `checkPlayStoreUpdate(): Promise<PlayStoreUpdateInfo>` (Android only)
Checks for updates via Play Core.

#### `startInAppUpdate(type: UpdateType): Promise<void>` (Android only)
Starts an in-app update flow.

#### `completeInAppUpdate(): Promise<void>` (Android only)
Completes a flexible update (triggers app restart).

#### `addUpdateListener(listener): UpdateSubscription` (Android only)
Subscribes to update download progress.

### Types

#### `UpdateType`
```ts
enum UpdateType {
  FLEXIBLE = 0,  // Background download, user can continue using app
  IMMEDIATE = 1, // Full-screen blocking update
}
```

#### `AppUpdateError`
```ts
class AppUpdateError extends Error {
  code: AppUpdateErrorCode;
  nativeError?: unknown;
}

enum AppUpdateErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  APP_NOT_FOUND = 'APP_NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  NOT_FROM_PLAY_STORE = 'NOT_FROM_PLAY_STORE',
  PLAY_STORE_NOT_AVAILABLE = 'PLAY_STORE_NOT_AVAILABLE',
  CHECK_FAILED = 'CHECK_FAILED',
  UPDATE_FAILED = 'UPDATE_FAILED',
  UPDATE_CANCELLED = 'UPDATE_CANCELLED',
  UNKNOWN = 'UNKNOWN',
}
```

## Android In-App Updates

Android supports two update types:

### Flexible Update
- Downloads in background
- User can continue using the app
- Call `completeUpdate()` when ready to install

```tsx
const { startUpdate, isReadyToInstall, completeUpdate } = useAppUpdate();

// Start flexible update
await startUpdate(UpdateType.FLEXIBLE);

// When download completes, show install prompt
if (isReadyToInstall) {
  await completeUpdate(); // App will restart
}
```

### Immediate Update
- Full-screen blocking UI
- User cannot use app until update completes

```tsx
await startUpdate(UpdateType.IMMEDIATE);
// App will restart automatically after update
```

## Requirements

- React Native >= 0.73.0
- iOS >= 13.0
- Android: App must be installed from Play Store for in-app updates

## License

MIT
