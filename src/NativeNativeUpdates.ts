/**
 * Codegen spec for New Architecture support
 * This file defines the TurboModule interface for rn-native-updates
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Get constants (replaces readonly properties)
  getConstants(): {
    currentVersion: string;
    buildNumber: string;
    packageName: string;
    country: string;
  };

  // iOS Methods
  getAppStoreVersion(
    country: string | null,
    forceRefresh: boolean
  ): Promise<{
    version: string;
    trackId: number;
    trackViewUrl: string;
    currentVersionReleaseDate: string;
    releaseNotes: string | null;
    minimumOsVersion: string;
  }>;

  // Android Methods
  checkPlayStoreUpdate(): Promise<{
    updateAvailability: number;
    availableVersionCode: number | null;
    isFlexibleUpdateAllowed: boolean;
    isImmediateUpdateAllowed: boolean;
    clientVersionStalenessDays: number | null;
    updatePriority: number;
    totalBytesToDownload: number;
    packageName: string;
  }>;

  startUpdate(updateType: number): Promise<void>;
  completeUpdate(): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeUpdates');
