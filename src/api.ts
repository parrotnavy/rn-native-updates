import { Linking, NativeEventEmitter, Platform } from 'react-native';

import { NativeUpdatesModule } from './NativeUpdatesModule';
import {
  type AppStoreInfo,
  AppUpdateError,
  AppUpdateErrorCode,
  type GetLatestVersionOptions,
  type GetStoreUrlOptions,
  type NeedUpdateOptions,
  type NeedUpdateResult,
  type PlayStoreUpdateInfo,
  UpdateAvailability,
  type UpdateListener,
  type UpdateSubscription,
  type UpdateType,
} from './types';
import { isNewerVersion } from './versionUtils';

export function getPackageName(): string {
  return NativeUpdatesModule.packageName;
}

export function getCurrentVersion(): string {
  return NativeUpdatesModule.currentVersion;
}

export function getCurrentBuildNumber(): number {
  return Number.parseInt(NativeUpdatesModule.buildNumber, 10) || 0;
}

export function getCountry(): string {
  return NativeUpdatesModule.country;
}

export async function getLatestVersion(options?: GetLatestVersionOptions): Promise<string> {
  if (Platform.OS === 'ios') {
    const info = await NativeUpdatesModule.getAppStoreVersion(
      options?.country ?? null,
      options?.forceRefresh ?? false,
    );
    return info.version;
  }

  if (Platform.OS === 'android') {
    const info = await checkPlayStoreUpdate();
    if (
      info.updateAvailability === UpdateAvailability.UPDATE_AVAILABLE &&
      info.availableVersionCode
    ) {
      return info.availableVersionCode.toString();
    }
    return getCurrentVersion();
  }

  throw new AppUpdateError(AppUpdateErrorCode.UNKNOWN, `Platform ${Platform.OS} is not supported`);
}

export async function getStoreUrl(options?: GetStoreUrlOptions): Promise<string> {
  const packageName = getPackageName();

  if (Platform.OS === 'ios') {
    try {
      const info = await NativeUpdatesModule.getAppStoreVersion(options?.country ?? null, false);
      return info.trackViewUrl;
    } catch (e) {
      if (e instanceof AppUpdateError) {
        throw e;
      }
      throw new AppUpdateError(
        AppUpdateErrorCode.UNKNOWN,
        `Failed to get store URL: ${e instanceof Error ? e.message : String(e)}`,
        e,
      );
    }
  }

  if (Platform.OS === 'android') {
    return `https://play.google.com/store/apps/details?id=${packageName}`;
  }

  throw new AppUpdateError(AppUpdateErrorCode.UNKNOWN, `Platform ${Platform.OS} is not supported`);
}

export async function needUpdate(options?: NeedUpdateOptions): Promise<NeedUpdateResult> {
  const currentVersion =
    options?.currentVersion ??
    (Platform.OS === 'android' ? getCurrentBuildNumber().toString() : getCurrentVersion());
  const depth = options?.depth ?? Number.POSITIVE_INFINITY;

  let latestVersion: string;
  let storeUrl: string;

  if (options?.latestVersion) {
    latestVersion = options.latestVersion;
    storeUrl = await getStoreUrl({ country: options?.country });
  } else {
    if (Platform.OS === 'ios') {
      const info = await NativeUpdatesModule.getAppStoreVersion(
        options?.country ?? null,
        options?.forceRefresh ?? false,
      );
      latestVersion = info.version;
      storeUrl = info.trackViewUrl;
    } else if (Platform.OS === 'android') {
      const info = await checkPlayStoreUpdate();
      latestVersion = info.availableVersionCode?.toString() ?? currentVersion;
      storeUrl = `https://play.google.com/store/apps/details?id=${getPackageName()}`;
    } else {
      throw new AppUpdateError(
        AppUpdateErrorCode.UNKNOWN,
        `Platform ${Platform.OS} is not supported`,
      );
    }
  }

  const isNeeded = isNewerVersion(currentVersion, latestVersion, depth);

  return {
    isNeeded,
    currentVersion,
    latestVersion,
    storeUrl,
  };
}

export async function openStore(options?: GetStoreUrlOptions): Promise<void> {
  const url = await getStoreUrl(options);
  const canOpen = await Linking.canOpenURL(url);

  if (canOpen) {
    await Linking.openURL(url);
  } else {
    throw new AppUpdateError(AppUpdateErrorCode.UNKNOWN, `Cannot open store URL: ${url}`);
  }
}

export async function getAppStoreInfo(options?: GetLatestVersionOptions): Promise<AppStoreInfo> {
  if (Platform.OS !== 'ios') {
    throw new AppUpdateError(
      AppUpdateErrorCode.UNKNOWN,
      'getAppStoreInfo is only available on iOS',
    );
  }

  return NativeUpdatesModule.getAppStoreVersion(
    options?.country ?? null,
    options?.forceRefresh ?? false,
  );
}

export async function checkPlayStoreUpdate(): Promise<PlayStoreUpdateInfo> {
  if (Platform.OS !== 'android') {
    throw new AppUpdateError(
      AppUpdateErrorCode.UNKNOWN,
      'checkPlayStoreUpdate is only available on Android',
    );
  }

  return NativeUpdatesModule.checkPlayStoreUpdate();
}

export async function startInAppUpdate(type: UpdateType): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new AppUpdateError(
      AppUpdateErrorCode.UNKNOWN,
      'startInAppUpdate is only available on Android',
    );
  }

  return NativeUpdatesModule.startUpdate(type);
}

export function completeInAppUpdate(): void {
  if (Platform.OS !== 'android') {
    throw new AppUpdateError(
      AppUpdateErrorCode.UNKNOWN,
      'completeInAppUpdate is only available on Android',
    );
  }

  NativeUpdatesModule.completeUpdate();
}

let eventSubscription: { remove: () => void } | null = null;
const listeners = new Set<UpdateListener>();

function setupEventListener(): void {
  if (eventSubscription || Platform.OS !== 'android') return;

  const emitter = new NativeEventEmitter(NativeUpdatesModule as any);

  const handleEvent = (_eventName: string, data: Record<string, unknown>) => {
    const safeNumber = (val: unknown, def: number) =>
      typeof val === 'number' && !Number.isNaN(val) ? val : def;

    const state = {
      installStatus: safeNumber(data.installStatus, 0),
      bytesDownloaded: safeNumber(data.bytesDownloaded, 0),
      totalBytesToDownload: safeNumber(data.totalBytesToDownload, 0),
      downloadProgress: safeNumber(data.downloadProgress, 0),
    };

    for (const listener of listeners) {
      listener(state);
    }
  };

  const progressSub = emitter.addListener('onUpdateProgress', (data: Record<string, unknown>) =>
    handleEvent('onUpdateProgress', data),
  );
  const downloadedSub = emitter.addListener('onUpdateDownloaded', (data: Record<string, unknown>) =>
    handleEvent('onUpdateDownloaded', data),
  );
  const installedSub = emitter.addListener('onUpdateInstalled', (data: Record<string, unknown>) =>
    handleEvent('onUpdateInstalled', data),
  );
  const failedSub = emitter.addListener('onUpdateFailed', (data: Record<string, unknown>) =>
    handleEvent('onUpdateFailed', data),
  );

  eventSubscription = {
    remove: () => {
      progressSub.remove();
      downloadedSub.remove();
      installedSub.remove();
      failedSub.remove();
      eventSubscription = null;
    },
  };
}

export function addUpdateListener(listener: UpdateListener): UpdateSubscription {
  if (Platform.OS !== 'android') {
    return { remove: () => {} };
  }

  setupEventListener();
  listeners.add(listener);

  return {
    remove: () => {
      listeners.delete(listener);
      if (listeners.size === 0 && eventSubscription) {
        eventSubscription.remove();
      }
    },
  };
}
