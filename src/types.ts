/**
 * @parrotnavy/rn-native-updates
 * TypeScript Type Definitions
 */

// =============================================================================
// Error Types
// =============================================================================

/**
 * Error codes returned by the native modules
 */
export enum AppUpdateErrorCode {
  /** Network request failed */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** App not found on store */
  APP_NOT_FOUND = 'APP_NOT_FOUND',
  /** API rate limit exceeded (iOS) */
  RATE_LIMITED = 'RATE_LIMITED',
  /** App not installed from Play Store (Android) */
  NOT_FROM_PLAY_STORE = 'NOT_FROM_PLAY_STORE',
  /** Play Store not available on device (Android) */
  PLAY_STORE_NOT_AVAILABLE = 'PLAY_STORE_NOT_AVAILABLE',
  /** Update check failed */
  CHECK_FAILED = 'CHECK_FAILED',
  /** Update flow failed */
  UPDATE_FAILED = 'UPDATE_FAILED',
  /** Update was cancelled by user */
  UPDATE_CANCELLED = 'UPDATE_CANCELLED',
  /** Unknown error */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error class for app update operations
 */
export class AppUpdateError extends Error {
  code: AppUpdateErrorCode;
  nativeError?: unknown;

  constructor(code: AppUpdateErrorCode, message: string, nativeError?: unknown) {
    super(message);
    this.name = 'AppUpdateError';
    this.code = code;
    this.nativeError = nativeError;
  }
}

// =============================================================================
// Android Types
// =============================================================================

/**
 * Android update type
 */
export enum UpdateType {
  /** Background download, user can continue using app */
  FLEXIBLE = 0,
  /** Full-screen blocking update */
  IMMEDIATE = 1,
}

/**
 * Android update availability status
 */
export enum UpdateAvailability {
  UNKNOWN = 0,
  UPDATE_NOT_AVAILABLE = 1,
  UPDATE_AVAILABLE = 2,
  DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS = 3,
}

/**
 * Android install status
 */
export enum InstallStatus {
  UNKNOWN = 0,
  PENDING = 1,
  DOWNLOADING = 2,
  DOWNLOADED = 3,
  INSTALLING = 4,
  INSTALLED = 5,
  FAILED = 6,
  CANCELED = 7,
}

/**
 * Android Play Store update info
 */
export interface PlayStoreUpdateInfo {
  /** Update availability status */
  updateAvailability: UpdateAvailability;
  /** Available version code (if update available) */
  availableVersionCode: number | null;
  /** Whether flexible update is allowed */
  isFlexibleUpdateAllowed: boolean;
  /** Whether immediate update is allowed */
  isImmediateUpdateAllowed: boolean;
  /** Days since update became available */
  clientVersionStalenessDays: number | null;
  /** Update priority (0-5, set in Play Console) */
  updatePriority: number;
  /** Total bytes to download */
  totalBytesToDownload: number;
  /** Package name */
  packageName: string;
}

/**
 * Android install state during update
 */
export interface InstallState {
  /** Current install status */
  installStatus: InstallStatus;
  /** Bytes downloaded so far */
  bytesDownloaded: number;
  /** Total bytes to download */
  totalBytesToDownload: number;
  /** Download progress percentage (0-100) */
  downloadProgress: number;
}

/**
 * Android update listener callback
 */
export type UpdateListener = (state: InstallState) => void;

/**
 * Subscription handle for removing listener
 */
export interface UpdateSubscription {
  remove: () => void;
}

// =============================================================================
// iOS Types
// =============================================================================

/**
 * iOS App Store version info
 */
export interface AppStoreInfo {
  /** App Store version */
  version: string;
  /** iTunes track ID */
  trackId: number;
  /** App Store URL */
  trackViewUrl: string;
  /** Release date of current version */
  currentVersionReleaseDate: string;
  /** Release notes */
  releaseNotes: string | null;
  /** Minimum iOS version required */
  minimumOsVersion: string;
}

// =============================================================================
// Common Types
// =============================================================================

/**
 * Result of needUpdate() check
 */
export interface NeedUpdateResult {
  /** Whether an update is needed */
  isNeeded: boolean;
  /** Current installed version */
  currentVersion: string;
  /** Latest version available on store */
  latestVersion: string;
  /** Store URL (App Store or Play Store) */
  storeUrl: string;
}

/**
 * Options for getLatestVersion()
 */
export interface GetLatestVersionOptions {
  /** Force refresh (bypass cache) - iOS only */
  forceRefresh?: boolean;
  /** Country code for App Store lookup (e.g., 'us', 'kr') - iOS only */
  country?: string;
}

/**
 * Options for needUpdate()
 */
export interface NeedUpdateOptions extends GetLatestVersionOptions {
  /** Current version to compare (defaults to installed version) */
  currentVersion?: string;
  /** Latest version to compare (will fetch from store if not provided) */
  latestVersion?: string;
  /**
   * Depth of version comparison
   * - 1: Major only (1.x.x)
   * - 2: Major + Minor (1.2.x)
   * - 3: Major + Minor + Patch (1.2.3)
   * - Infinity: Full comparison (default)
   */
  depth?: number;
}

/**
 * Options for getStoreUrl()
 */
export interface GetStoreUrlOptions {
  /** Country code for App Store URL - iOS only */
  country?: string;
}

// =============================================================================
// Hook Types
// =============================================================================

/**
 * Options for useAppUpdate hook
 */
export interface UseAppUpdateOptions {
  /** Automatically check for updates on mount (default: false) */
  checkOnMount?: boolean;
  /** Country code for App Store lookup - iOS only */
  country?: string;
  /** Error callback */
  onError?: (error: AppUpdateError) => void;
}

/**
 * Return type of useAppUpdate hook
 */
export interface UseAppUpdateResult {
  // === State ===

  /** Whether an update check is in progress */
  isChecking: boolean;

  /** Whether an update is available */
  isUpdateAvailable: boolean;

  /** Current installed version */
  currentVersion: string;

  /** Latest version available on store (null if not checked) */
  latestVersion: string | null;

  /** Store URL for the app */
  storeUrl: string | null;

  /** Last error that occurred */
  error: AppUpdateError | null;

  // === Android-specific state ===

  /** Android: Whether update is currently downloading */
  isDownloading: boolean;

  /** Android: Download progress (0-100) */
  downloadProgress: number;

  /** Android: Whether download is complete and ready to install */
  isReadyToInstall: boolean;

  /** Android: Detailed Play Store update info */
  playStoreInfo: PlayStoreUpdateInfo | null;

  // === Actions ===

  /** Check for available updates */
  checkUpdate: () => Promise<void>;

  /** Open store page for the app */
  openStore: () => Promise<void>;

  /**
   * Android: Start in-app update
   * @param type - Update type (FLEXIBLE or IMMEDIATE)
   */
  startUpdate: (type: UpdateType) => Promise<void>;

  /**
   * Android: Complete flexible update (triggers app restart)
   * Only call after download is complete
   */
  completeUpdate: () => Promise<void>;
}

// =============================================================================
// Native Module Types (internal)
// =============================================================================

/**
 * Native module constants (exposed at load time)
 */
export interface NativeConstants {
  /** Current app version */
  currentVersion: string;
  /** Current build number */
  buildNumber: string;
  /** Bundle ID (iOS) or package name (Android) */
  packageName: string;
  /** Device country code */
  country: string;
}

/**
 * Native module interface (internal)
 */
export interface NativeUpdatesModuleType extends NativeConstants {
  // iOS
  getAppStoreVersion(country: string | null, forceRefresh: boolean): Promise<AppStoreInfo>;

  // Android
  checkPlayStoreUpdate(): Promise<PlayStoreUpdateInfo>;
  startUpdate(updateType: number): Promise<void>;
  completeUpdate(): Promise<void>;
}
