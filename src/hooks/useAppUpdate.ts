import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import {
  addUpdateListener,
  checkPlayStoreUpdate,
  completeInAppUpdate,
  getCurrentBuildNumber,
  getCurrentVersion,
  getPackageName,
  needUpdate,
  openStore,
  startInAppUpdate,
} from '../api';
import {
  AppUpdateError,
  AppUpdateErrorCode,
  InstallStatus,
  type PlayStoreUpdateInfo,
  UpdateAvailability,
  type UpdateSubscription,
  type UpdateType,
  type UseAppUpdateOptions,
  type UseAppUpdateResult,
} from '../types';

export function useAppUpdate(options?: UseAppUpdateOptions): UseAppUpdateResult {
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [currentVersion] = useState(getCurrentVersion);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [error, setError] = useState<AppUpdateError | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isReadyToInstall, setIsReadyToInstall] = useState(false);
  const [playStoreInfo, setPlayStoreInfo] = useState<PlayStoreUpdateInfo | null>(null);

  const subscriptionRef = useRef<UpdateSubscription | null>(null);
  const mountedRef = useRef(true);

  const checkUpdate = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsChecking(true);
    setError(null);

    try {
      if (Platform.OS === 'android') {
        const info = await checkPlayStoreUpdate();
        if (!mountedRef.current) return;

        setPlayStoreInfo(info);
        const isAvailable = info.updateAvailability === UpdateAvailability.UPDATE_AVAILABLE;
        setIsUpdateAvailable(isAvailable);
        setLatestVersion(
          isAvailable && info.availableVersionCode
            ? info.availableVersionCode.toString()
            : getCurrentBuildNumber().toString(),
        );
        setStoreUrl(`https://play.google.com/store/apps/details?id=${getPackageName()}`);
      } else {
        const result = await needUpdate({
          country: options?.country,
          forceRefresh: true,
        });

        if (!mountedRef.current) return;

        setIsUpdateAvailable(result.isNeeded);
        setLatestVersion(result.latestVersion);
        setStoreUrl(result.storeUrl);
      }
    } catch (e) {
      if (!mountedRef.current) return;

      const appError =
        e instanceof AppUpdateError
          ? e
          : new AppUpdateError(AppUpdateErrorCode.CHECK_FAILED, String(e));

      setError(appError);
      options?.onError?.(appError);
    } finally {
      if (mountedRef.current) {
        setIsChecking(false);
      }
    }
  }, [options?.country, options?.onError]);

  const handleOpenStore = useCallback(async () => {
    try {
      await openStore({ country: options?.country });
    } catch (e) {
      const appError =
        e instanceof AppUpdateError ? e : new AppUpdateError(AppUpdateErrorCode.UNKNOWN, String(e));
      setError(appError);
      options?.onError?.(appError);
    }
  }, [options?.country, options?.onError]);

  const handleStartUpdate = useCallback(
    async (type: UpdateType) => {
      if (Platform.OS !== 'android') return;

      setError(null);

      subscriptionRef.current?.remove();
      subscriptionRef.current = addUpdateListener((state) => {
        if (!mountedRef.current) return;

        setDownloadProgress(state.downloadProgress);

        if (state.installStatus === InstallStatus.DOWNLOADING) {
          setIsDownloading(true);
          setIsReadyToInstall(false);
        } else if (state.installStatus === InstallStatus.DOWNLOADED) {
          setIsDownloading(false);
          setIsReadyToInstall(true);
        } else if (
          state.installStatus === InstallStatus.INSTALLED ||
          state.installStatus === InstallStatus.FAILED ||
          state.installStatus === InstallStatus.CANCELED
        ) {
          setIsDownloading(false);
          if (state.installStatus !== InstallStatus.INSTALLED) {
            setIsReadyToInstall(false);
          }
        }
      });

      try {
        await startInAppUpdate(type);
      } catch (e) {
        const appError =
          e instanceof AppUpdateError
            ? e
            : new AppUpdateError(AppUpdateErrorCode.UPDATE_FAILED, String(e));
        setError(appError);
        options?.onError?.(appError);
      }
    },
    [options?.onError],
  );

  const handleCompleteUpdate = useCallback(async () => {
    if (Platform.OS !== 'android') return;

    try {
      completeInAppUpdate();
    } catch (e) {
      const appError =
        e instanceof AppUpdateError
          ? e
          : new AppUpdateError(AppUpdateErrorCode.UPDATE_FAILED, String(e));
      setError(appError);
      options?.onError?.(appError);
    }
  }, [options?.onError]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: checkOnMount is intentionally only checked once on mount
  useEffect(() => {
    mountedRef.current = true;

    if (options?.checkOnMount) {
      checkUpdate();
    }

    return () => {
      mountedRef.current = false;
      subscriptionRef.current?.remove();
    };
  }, []);

  return {
    isChecking,
    isUpdateAvailable,
    currentVersion,
    latestVersion,
    storeUrl,
    error,
    isDownloading,
    downloadProgress,
    isReadyToInstall,
    playStoreInfo,
    checkUpdate,
    openStore: handleOpenStore,
    startUpdate: handleStartUpdate,
    completeUpdate: handleCompleteUpdate,
  };
}
