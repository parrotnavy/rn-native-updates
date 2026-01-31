import type { UpdateSubscription } from '@parrotnavy/rn-native-updates';
import {
  addUpdateListener,
  checkPlayStoreUpdate,
  completeInAppUpdate,
  getAppStoreInfo,
  getCountry,
  getCurrentBuildNumber,
  getCurrentVersion,
  getLatestVersion,
  getPackageName,
  getStoreUrl,
  needUpdate,
  openStore,
  startInAppUpdate,
  UpdateType,
  useAppUpdate,
} from '@parrotnavy/rn-native-updates';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'hook' | 'function'>('hook');
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const subscriptionRef = useRef<UpdateSubscription | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // ── Hook API Setup ──────────────────────────────────────────────────────────

  const {
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
    openStore: hookOpenStore,
    startUpdate,
    completeUpdate,
  } = useAppUpdate({
    checkOnMount: false,
    onError: (err) => addLog(`Hook Error: ${err.code} - ${err.message}`),
  });

  // Cleanup addUpdateListener on unmount
  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  // ── Hook API Handlers ───────────────────────────────────────────────────────

  const handleHookCheck = async () => {
    addLog('Hook: checkUpdate()...');
    await checkUpdate();
    addLog('Hook: checkUpdate completed');
  };

  const handleHookOpenStore = async () => {
    addLog('Hook: openStore()...');
    await hookOpenStore();
  };

  const handleHookStartFlexible = async () => {
    addLog('Hook: startUpdate(FLEXIBLE)...');
    await startUpdate(UpdateType.FLEXIBLE);
  };

  const handleHookStartImmediate = async () => {
    addLog('Hook: startUpdate(IMMEDIATE)...');
    await startUpdate(UpdateType.IMMEDIATE);
  };

  const handleHookComplete = async () => {
    addLog('Hook: completeUpdate()...');
    await completeUpdate();
  };

  // ── Function API Handlers: App Info (sync) ──────────────────────────────────

  const handleGetCurrentVersion = () => {
    try {
      const result = getCurrentVersion();
      addLog(`getCurrentVersion() → ${result}`);
    } catch (err) {
      addLog(
        `getCurrentVersion error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleGetCurrentBuildNumber = () => {
    try {
      const result = getCurrentBuildNumber();
      addLog(`getCurrentBuildNumber() → ${result}`);
    } catch (err) {
      addLog(
        `getCurrentBuildNumber error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleGetPackageName = () => {
    try {
      const result = getPackageName();
      addLog(`getPackageName() → ${result}`);
    } catch (err) {
      addLog(
        `getPackageName error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleGetCountry = () => {
    try {
      const result = getCountry();
      addLog(`getCountry() → ${result}`);
    } catch (err) {
      addLog(
        `getCountry error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  // ── Function API Handlers: Store (async) ────────────────────────────────────

  const handleGetLatestVersion = async () => {
    try {
      setLoading(true);
      addLog('getLatestVersion()...');
      const result = await getLatestVersion();
      addLog(`getLatestVersion() → ${result}`);
    } catch (err) {
      addLog(
        `getLatestVersion error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGetStoreUrl = async () => {
    try {
      setLoading(true);
      addLog('getStoreUrl()...');
      const result = await getStoreUrl();
      addLog(`getStoreUrl() → ${result}`);
    } catch (err) {
      addLog(
        `getStoreUrl error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNeedUpdate = async (depth?: number) => {
    try {
      setLoading(true);
      addLog(`needUpdate(${depth != null ? `{depth: ${depth}}` : ''})...`);
      const result = await needUpdate(depth != null ? { depth } : undefined);
      addLog(`  isNeeded: ${result.isNeeded}`);
      addLog(`  currentVersion: ${result.currentVersion}`);
      addLog(`  latestVersion: ${result.latestVersion}`);
      addLog(`  storeUrl: ${result.storeUrl}`);
    } catch (err) {
      addLog(
        `needUpdate error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStore = async () => {
    try {
      addLog('openStore()...');
      await openStore();
      addLog('openStore() → store opened');
    } catch (err) {
      addLog(
        `openStore error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  // ── Function API Handlers: iOS Only ─────────────────────────────────────────

  const handleGetAppStoreInfo = async () => {
    try {
      setLoading(true);
      addLog('getAppStoreInfo()...');
      const info = await getAppStoreInfo();
      addLog(`  version: ${info.version}`);
      addLog(`  trackId: ${info.trackId}`);
      addLog(`  trackViewUrl: ${info.trackViewUrl}`);
      addLog(`  releaseDate: ${info.currentVersionReleaseDate}`);
      addLog(`  releaseNotes: ${info.releaseNotes ?? 'null'}`);
      addLog(`  minimumOsVersion: ${info.minimumOsVersion}`);
    } catch (err) {
      addLog(
        `getAppStoreInfo error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Function API Handlers: Android Only ─────────────────────────────────────

  const handleCheckPlayStoreUpdate = async () => {
    try {
      setLoading(true);
      addLog('checkPlayStoreUpdate()...');
      const info = await checkPlayStoreUpdate();
      addLog(`  updateAvailability: ${info.updateAvailability}`);
      addLog(`  availableVersionCode: ${info.availableVersionCode}`);
      addLog(`  isFlexibleAllowed: ${info.isFlexibleUpdateAllowed}`);
      addLog(`  isImmediateAllowed: ${info.isImmediateUpdateAllowed}`);
      addLog(`  stalenessDays: ${info.clientVersionStalenessDays}`);
      addLog(`  priority: ${info.updatePriority}`);
      addLog(`  totalBytes: ${info.totalBytesToDownload}`);
      addLog(`  packageName: ${info.packageName}`);
    } catch (err) {
      addLog(
        `checkPlayStoreUpdate error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartInAppUpdate = async (type: UpdateType) => {
    try {
      setLoading(true);
      const typeName = type === UpdateType.FLEXIBLE ? 'FLEXIBLE' : 'IMMEDIATE';
      addLog(`startInAppUpdate(${typeName})...`);
      await startInAppUpdate(type);
      addLog(`startInAppUpdate(${typeName}) → started`);
    } catch (err) {
      addLog(
        `startInAppUpdate error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInAppUpdate = async () => {
    try {
      addLog('completeInAppUpdate()...');
      await completeInAppUpdate();
      addLog('completeInAppUpdate() → app will restart');
    } catch (err) {
      addLog(
        `completeInAppUpdate error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleSubscribe = () => {
    if (subscriptionRef.current) {
      addLog('Already subscribed to update events');
      return;
    }
    subscriptionRef.current = addUpdateListener((state) => {
      addLog(
        `Update: status=${state.installStatus} ` +
          `progress=${state.downloadProgress}% ` +
          `(${state.bytesDownloaded}/${state.totalBytesToDownload})`,
      );
    });
    addLog('Subscribed to update events');
  };

  const handleUnsubscribe = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
      addLog('Unsubscribed from update events');
    } else {
      addLog('No active subscription');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>@parrotnavy/rn-native-updates</Text>
        <Text style={styles.subtitle}>
          Expo Example ({Platform.OS})
        </Text>

        {/* Tab Bar */}
        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => setActiveTab('hook')}
            style={[
              styles.tabButton,
              activeTab === 'hook' && styles.tabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'hook' && styles.tabButtonTextActive,
              ]}
            >
              Hook API
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('function')}
            style={[
              styles.tabButton,
              activeTab === 'function' && styles.tabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'function' && styles.tabButtonTextActive,
              ]}
            >
              Function API
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        {activeTab === 'hook' ? (
          <>
            {/* Hook: Update Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Update Status</Text>
              <InfoRow label="Current Version" value={currentVersion} />
              <InfoRow
                label="Latest Version"
                value={latestVersion ?? 'Not checked'}
              />
              <InfoRow
                label="Update Available"
                value={isUpdateAvailable ? 'Yes' : 'No'}
                valueStyle={
                  isUpdateAvailable ? styles.updateAvailable : undefined
                }
              />
              <InfoRow
                label="Downloading"
                value={isDownloading ? `Yes (${downloadProgress.toFixed(0)}%)` : 'No'}
              />
              <InfoRow
                label="Ready to Install"
                value={isReadyToInstall ? 'Yes' : 'No'}
              />
              {storeUrl && <InfoRow label="Store URL" value={storeUrl} small />}
              {error && (
                <InfoRow
                  label="Error"
                  value={`${error.code}: ${error.message}`}
                  valueStyle={styles.errorText}
                />
              )}
            </View>

            {/* Hook: Play Store Info (Android) */}
            {Platform.OS === 'android' && playStoreInfo && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Play Store Info{' '}
                  <Text style={styles.platformBadge}>(Android only)</Text>
                </Text>
                <InfoRow
                  label="Availability"
                  value={String(playStoreInfo.updateAvailability)}
                />
                <InfoRow
                  label="Version Code"
                  value={String(playStoreInfo.availableVersionCode ?? 'N/A')}
                />
                <InfoRow
                  label="Priority"
                  value={String(playStoreInfo.updatePriority)}
                />
                <InfoRow
                  label="Staleness Days"
                  value={String(
                    playStoreInfo.clientVersionStalenessDays ?? 'N/A',
                  )}
                />
                <InfoRow
                  label="Flexible Allowed"
                  value={
                    playStoreInfo.isFlexibleUpdateAllowed ? 'Yes' : 'No'
                  }
                />
                <InfoRow
                  label="Immediate Allowed"
                  value={
                    playStoreInfo.isImmediateUpdateAllowed ? 'Yes' : 'No'
                  }
                />
                <InfoRow
                  label="Total Bytes"
                  value={String(playStoreInfo.totalBytesToDownload)}
                />
                <InfoRow label="Package" value={playStoreInfo.packageName} />
              </View>
            )}

            {/* Hook: Download Progress (Android) */}
            {Platform.OS === 'android' && isDownloading && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Download Progress</Text>
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${downloadProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {downloadProgress.toFixed(0)}%
                </Text>
              </View>
            )}

            {/* Hook: Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <Button
                title={isChecking ? 'Checking...' : 'Check for Updates'}
                onPress={handleHookCheck}
                disabled={isChecking}
              />
              {isUpdateAvailable && (
                <Button title="Open Store" onPress={handleHookOpenStore} />
              )}
              {Platform.OS === 'android' && isUpdateAvailable && (
                <>
                  <Button
                    title="Start Flexible Update"
                    onPress={handleHookStartFlexible}
                    disabled={isDownloading}
                  />
                  <Button
                    title="Start Immediate Update"
                    onPress={handleHookStartImmediate}
                    disabled={isDownloading}
                  />
                </>
              )}
              {Platform.OS === 'android' && isReadyToInstall && (
                <Button
                  title="Complete Update (Restart)"
                  onPress={handleHookComplete}
                  style={styles.completeButton}
                />
              )}
            </View>
          </>
        ) : (
          <>
            {/* Function: App Info (sync) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>App Info</Text>
              <Button
                title="getCurrentVersion()"
                onPress={handleGetCurrentVersion}
              />
              <Button
                title="getCurrentBuildNumber()"
                onPress={handleGetCurrentBuildNumber}
              />
              <Button
                title="getPackageName()"
                onPress={handleGetPackageName}
              />
              <Button title="getCountry()" onPress={handleGetCountry} />
            </View>

            {/* Function: Store (async) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Store</Text>
              <Button
                title="getLatestVersion()"
                onPress={handleGetLatestVersion}
              />
              <Button title="getStoreUrl()" onPress={handleGetStoreUrl} />
              <Button
                title="needUpdate()"
                onPress={() => handleNeedUpdate()}
              />
              <Button
                title="needUpdate({depth: 2})"
                onPress={() => handleNeedUpdate(2)}
              />
              <Button title="openStore()" onPress={handleOpenStore} />
            </View>

            {/* Function: iOS Only */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                iOS Only{' '}
                <Text style={styles.platformBadge}>(iOS only)</Text>
              </Text>
              <Button
                title="getAppStoreInfo()"
                onPress={handleGetAppStoreInfo}
              />
            </View>

            {/* Function: Android Only */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Android Only{' '}
                <Text style={styles.platformBadge}>(Android only)</Text>
              </Text>
              <Button
                title="checkPlayStoreUpdate()"
                onPress={handleCheckPlayStoreUpdate}
              />
              <Button
                title="startInAppUpdate(FLEXIBLE)"
                onPress={() => handleStartInAppUpdate(UpdateType.FLEXIBLE)}
              />
              <Button
                title="startInAppUpdate(IMMEDIATE)"
                onPress={() => handleStartInAppUpdate(UpdateType.IMMEDIATE)}
              />
              <Button
                title="completeInAppUpdate()"
                onPress={handleCompleteInAppUpdate}
              />
              <Button
                title="Subscribe to Updates"
                onPress={handleSubscribe}
              />
              <Button title="Unsubscribe" onPress={handleUnsubscribe} />
            </View>
          </>
        )}

        {/* Shared Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logs</Text>
          {logs.length === 0 ? (
            <Text style={styles.logEmpty}>No logs yet</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))
          )}
        </View>
      </ScrollView>

      {(isChecking || loading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  valueStyle,
  small,
}: {
  label: string;
  value: string;
  valueStyle?: object;
  small?: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[styles.infoValue, small && styles.infoValueSmall, valueStyle]}
        numberOfLines={small ? 2 : 1}
      >
        {value}
      </Text>
    </View>
  );
}

function Button({
  title,
  onPress,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: object;
}): React.JSX.Element {
  return (
    <Pressable
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  tabButtonActive: {
    backgroundColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    color: '#666',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  platformBadge: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  infoValueSmall: {
    fontSize: 12,
  },
  updateAvailable: {
    color: '#34C759',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextDisabled: {
    color: '#999',
  },
  completeButton: {
    backgroundColor: '#34C759',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  logEmpty: {
    color: '#999',
    fontStyle: 'italic',
  },
  logText: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
