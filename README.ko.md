# @parrotnavy/rn-native-updates

[English](./README.md)

React Native 앱 업데이트 확인 라이브러리로, 훅(Hook) 지원이 포함되어 있습니다.
Android는 Play Core In-App Updates, iOS는 iTunes Lookup API를 사용합니다.

## 주요 기능

- **Hook API** - `useAppUpdate()`로 React 컴포넌트에 쉽게 통합
- **Function API** - `react-native-version-check` 스타일의 API와 호환
- **Android In-App Updates** - Play Core를 통한 유연(Flexible) 및 즉시(Immediate) 업데이트 플로우
- **iOS App Store Check** - iTunes API 기반 버전 조회 및 캐싱
- **TypeScript** - 완전한 타입 정의 포함
- **Expo & Bare RN** - Expo 및 Bare React Native 프로젝트 모두 지원

## 설치

```bash
npm install @parrotnavy/rn-native-updates
# 또는
yarn add @parrotnavy/rn-native-updates
```

### iOS 설정

```bash
cd ios && pod install
```

### Android 설정

추가 설정이 필요하지 않습니다. 라이브러리가 Play Core를 자동으로 포함합니다.

> **참고**: Android In-App Updates는 Google Play Store에서 설치된 앱에서만 동작합니다.

## 사용법

### Hook API (권장)

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
    startUpdate,    // Android 전용
    completeUpdate, // Android 전용
  } = useAppUpdate({
    checkOnMount: true,
    onError: (error) => console.log('업데이트 확인 실패:', error),
  });

  if (isUpdateAvailable) {
    return (
      <View>
        <Text>업데이트 가능: {latestVersion}</Text>
        <Button title="지금 업데이트" onPress={() => startUpdate(UpdateType.IMMEDIATE)} />
      </View>
    );
  }

  return <Text>최신 버전입니다: {currentVersion}</Text>;
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

// 현재 설치된 버전
const version = getCurrentVersion(); // "1.0.0"

// 스토어 최신 버전 조회
const latest = await getLatestVersion(); // "1.1.0"

// 업데이트 필요 여부 확인
const result = await needUpdate();
// { isNeeded: true, currentVersion: "1.0.0", latestVersion: "1.1.0", storeUrl: "..." }

// 스토어 페이지 열기
await openStore();
```

## API 레퍼런스

### 훅: `useAppUpdate(options?)`

#### 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|--------|------|---------|-------------|
| `checkOnMount` | `boolean` | `false` | 컴포넌트 마운트 시 자동으로 업데이트 확인 |
| `country` | `string` | 디바이스 로케일 | App Store 조회용 국가 코드 (iOS 전용) |
| `onError` | `(error: AppUpdateError) => void` | - | 에러 콜백 |

#### 반환 값

| 속성 | 타입 | 설명 |
|----------|------|-------------|
| `isChecking` | `boolean` | 업데이트 확인 중인지 여부 |
| `isUpdateAvailable` | `boolean` | 업데이트 가능 여부 |
| `currentVersion` | `string` | 현재 설치된 버전 |
| `latestVersion` | `string \| null` | 최신 버전 (미확인 시 null) |
| `storeUrl` | `string \| null` | 앱 스토어 URL |
| `error` | `AppUpdateError \| null` | 마지막으로 발생한 오류 |
| `isDownloading` | `boolean` | Android: 다운로드 중인지 여부 |
| `downloadProgress` | `number` | Android: 다운로드 진행률 (0-100) |
| `isReadyToInstall` | `boolean` | Android: 다운로드 완료 여부 |
| `playStoreInfo` | `PlayStoreUpdateInfo \| null` | Android: Play Store 상세 정보 |
| `checkUpdate` | `() => Promise<void>` | 업데이트 확인 |
| `openStore` | `() => Promise<void>` | 스토어 페이지 열기 |
| `startUpdate` | `(type: UpdateType) => Promise<void>` | Android: 인앱 업데이트 시작 |
| `completeUpdate` | `() => Promise<void>` | Android: 유연 업데이트 완료 |

### 함수

#### `getCurrentVersion(): string`
현재 설치된 앱 버전을 반환합니다.

#### `getCurrentBuildNumber(): number`
현재 빌드 번호를 반환합니다.

#### `getPackageName(): string`
번들 ID(iOS) 또는 패키지명(Android)을 반환합니다.

#### `getCountry(): string`
디바이스 국가 코드를 반환합니다.

#### `getLatestVersion(options?): Promise<string>`
스토어의 최신 버전을 가져옵니다.

| 옵션 | 타입 | 설명 |
|--------|------|-------------|
| `forceRefresh` | `boolean` | 캐시 무시 (iOS 전용) |
| `country` | `string` | 국가 코드 (iOS 전용) |

#### `needUpdate(options?): Promise<NeedUpdateResult>`
업데이트가 필요한지 확인합니다.

| 옵션 | 타입 | 설명 |
|--------|------|-------------|
| `currentVersion` | `string` | 비교할 현재 버전 (기본값: 설치된 버전) |
| `latestVersion` | `string` | 최신 버전 (미제공 시 스토어에서 조회) |
| `depth` | `number` | 버전 비교 깊이 (1=major, 2=major.minor 등) |
| `forceRefresh` | `boolean` | 캐시 무시 (iOS 전용) |
| `country` | `string` | 국가 코드 (iOS 전용) |

#### `openStore(options?): Promise<void>`
앱 스토어 페이지를 엽니다.

#### `getAppStoreInfo(options?): Promise<AppStoreInfo>` (iOS 전용)
App Store 상세 정보를 반환합니다.

#### `checkPlayStoreUpdate(): Promise<PlayStoreUpdateInfo>` (Android 전용)
Play Core를 통해 업데이트를 확인합니다.

#### `startInAppUpdate(type: UpdateType): Promise<void>` (Android 전용)
인앱 업데이트 플로우를 시작합니다.

#### `completeInAppUpdate(): Promise<void>` (Android 전용)
유연 업데이트를 완료합니다(앱 재시작).

#### `addUpdateListener(listener): UpdateSubscription` (Android 전용)
다운로드 진행률 업데이트를 구독합니다.

### 타입

#### `UpdateType`
```ts
enum UpdateType {
  FLEXIBLE = 0,  // 백그라운드 다운로드, 사용자 앱 사용 가능
  IMMEDIATE = 1, // 전체 화면 차단 업데이트
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

## Android 인앱 업데이트

Android는 두 가지 업데이트 유형을 지원합니다.

### 유연(Flexible) 업데이트
- 백그라운드에서 다운로드
- 사용자 계속 앱 사용 가능
- 다운로드 완료 후 `completeUpdate()` 호출

```tsx
const { startUpdate, isReadyToInstall, completeUpdate } = useAppUpdate();

// 유연 업데이트 시작
await startUpdate(UpdateType.FLEXIBLE);

// 다운로드 완료 시 설치 완료
if (isReadyToInstall) {
  await completeUpdate(); // 앱 재시작
}
```

### 즉시(Immediate) 업데이트
- 전체 화면 차단 UI
- 업데이트 완료 전까지 앱 사용 불가

```tsx
await startUpdate(UpdateType.IMMEDIATE);
// 업데이트 완료 후 앱 자동 재시작
```

## 요구 사항

- React Native >= 0.73.0
- iOS >= 13.0
- Android: Play Store에서 설치된 앱만 인앱 업데이트 지원

## 라이선스

MIT
