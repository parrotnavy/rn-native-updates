/**
 * Comprehensive component tests for the Example Bare App.
 *
 * Covers: rendering, tab switching, sync/async function calls,
 * platform-specific functions, log display, and error handling.
 */

import 'react-native';

import {afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import React from 'react';
// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';
import App from '../App';

// ── Mock all 15 library exports ──────────────────────────────────────────────

jest.mock('@parrotnavy/rn-native-updates', () => ({
  useAppUpdate: jest.fn(() => ({
    isChecking: false,
    isUpdateAvailable: false,
    currentVersion: '1.0.0',
    latestVersion: null,
    storeUrl: null,
    error: null,
    isDownloading: false,
    downloadProgress: 0,
    isReadyToInstall: false,
    playStoreInfo: null,
    checkUpdate: jest.fn(),
    openStore: jest.fn(),
    startUpdate: jest.fn(),
    completeUpdate: jest.fn(),
  })),
  getCurrentVersion: jest.fn(() => '1.0.0'),
  getCurrentBuildNumber: jest.fn(() => 1),
  getPackageName: jest.fn(() => 'com.google.android.youtube'),
  getCountry: jest.fn(() => 'US'),
  getLatestVersion: jest.fn(),
  getStoreUrl: jest.fn(),
  needUpdate: jest.fn(),
  openStore: jest.fn(),
  getAppStoreInfo: jest.fn(),
  checkPlayStoreUpdate: jest.fn(),
  startInAppUpdate: jest.fn(),
  completeInAppUpdate: jest.fn(),
  addUpdateListener: jest.fn(() => ({remove: jest.fn()})),
  UpdateType: {FLEXIBLE: 0, IMMEDIATE: 1},
}));

const mockLib =
  require('@parrotnavy/rn-native-updates') as typeof import('@parrotnavy/rn-native-updates');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Create a fresh default hook return value with optional overrides. */
function createMockHookReturn(overrides: Record<string, unknown> = {}) {
  return {
    isChecking: false,
    isUpdateAvailable: false,
    currentVersion: '1.0.0',
    latestVersion: null,
    storeUrl: null,
    error: null,
    isDownloading: false,
    downloadProgress: 0,
    isReadyToInstall: false,
    playStoreInfo: null,
    checkUpdate: jest.fn(),
    openStore: jest.fn(),
    startUpdate: jest.fn(),
    completeUpdate: jest.fn(),
    ...overrides,
  };
}

/** Recursively search a toJSON() tree for text content. */
function treeContainsText(node: unknown, text: string): boolean {
  if (typeof node === 'string') return node.includes(text);
  if (node && typeof node === 'object' && 'children' in node) {
    const obj = node as {children?: unknown[]};
    return (obj.children ?? []).some(child => treeContainsText(child, text));
  }
  return false;
}

/** Find a pressable node whose descendant text matches the given title. */
function findPressableByTitle(
  root: renderer.ReactTestInstance,
  title: string,
): renderer.ReactTestInstance {
  const matches = root.findAll(node => {
    if (typeof node.props?.onPress !== 'function') return false;
    try {
      return (
        node.findAll(
          child =>
            Array.isArray(child.children) &&
            child.children.some(
              (c: unknown) => typeof c === 'string' && c === title,
            ),
        ).length > 0
      );
    } catch {
      return false;
    }
  });
  if (matches.length === 0) {
    throw new Error(`Pressable with title "${title}" not found`);
  }
  // Return deepest (most specific) match
  return matches[matches.length - 1]!;
}

/** Press a button identified by its visible title text. */
function pressButton(
  root: renderer.ReactTestInstance,
  title: string,
): void {
  findPressableByTitle(root, title).props.onPress();
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('App', () => {
  let tree: ReturnType<typeof renderer.create>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset hook return value
    (mockLib.useAppUpdate as jest.Mock).mockReturnValue(createMockHookReturn());

    // Reset sync mocks (in case a test overrode them)
    (mockLib.getCurrentVersion as jest.Mock).mockReturnValue('1.0.0');
    (mockLib.getCurrentBuildNumber as jest.Mock).mockReturnValue(1);
    (mockLib.getPackageName as jest.Mock).mockReturnValue(
      'com.google.android.youtube',
    );
    (mockLib.getCountry as jest.Mock).mockReturnValue('US');

    // Set default resolved values for async mocks
    (mockLib.getLatestVersion as jest.Mock).mockResolvedValue('2.0.0');
    (mockLib.getStoreUrl as jest.Mock).mockResolvedValue(
      'https://store.example.com',
    );
    (mockLib.needUpdate as jest.Mock).mockResolvedValue({
      isNeeded: true,
      currentVersion: '1.0.0',
      latestVersion: '2.0.0',
      storeUrl: 'https://store.example.com',
    });
    (mockLib.openStore as jest.Mock).mockResolvedValue(undefined);
    (mockLib.getAppStoreInfo as jest.Mock).mockResolvedValue({
      version: '2.0.0',
      trackId: 123456,
      trackViewUrl: 'https://apps.apple.com/app/id123456',
      currentVersionReleaseDate: '2024-01-01',
      releaseNotes: 'Bug fixes',
      minimumOsVersion: '14.0',
    });
    (mockLib.checkPlayStoreUpdate as jest.Mock).mockResolvedValue({
      updateAvailability: 2,
      availableVersionCode: 100,
      isFlexibleUpdateAllowed: true,
      isImmediateUpdateAllowed: true,
      clientVersionStalenessDays: 5,
      updatePriority: 3,
      totalBytesToDownload: 1024000,
      packageName: 'com.google.android.youtube',
    });
    (mockLib.startInAppUpdate as jest.Mock).mockResolvedValue(undefined);
    (mockLib.completeInAppUpdate as jest.Mock).mockResolvedValue(undefined);
    (mockLib.addUpdateListener as jest.Mock).mockReturnValue({
      remove: jest.fn(),
    });
  });

  afterEach(() => {
    tree?.unmount();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders without crashing', () => {
    act(() => {
      tree = renderer.create(<App />);
    });
    expect(tree.toJSON()).toBeTruthy();
  });

  it('displays the app title', () => {
    act(() => {
      tree = renderer.create(<App />);
    });
    expect(treeContainsText(tree.toJSON(), '@parrotnavy/rn-native-updates')).toBe(true);
  });

  // ── Tab Switching ──────────────────────────────────────────────────────────

  describe('tab switching', () => {
    it('shows Hook API tab by default', () => {
      act(() => {
        tree = renderer.create(<App />);
      });
      const json = tree.toJSON();
      expect(treeContainsText(json, 'Hook API')).toBe(true);
      expect(treeContainsText(json, 'Update Status')).toBe(true);
      // Function API content should NOT be visible
      expect(treeContainsText(json, 'App Info')).toBe(false);
    });

    it('switches to Function API tab', () => {
      act(() => {
        tree = renderer.create(<App />);
      });
      act(() => {
        pressButton(tree.root, 'Function API');
      });
      const json = tree.toJSON();
      expect(treeContainsText(json, 'App Info')).toBe(true);
      expect(treeContainsText(json, 'Store')).toBe(true);
      expect(treeContainsText(json, 'iOS Only')).toBe(true);
      expect(treeContainsText(json, 'Android Only')).toBe(true);
      // Hook API content should NOT be visible
      expect(treeContainsText(json, 'Update Status')).toBe(false);
    });

    it('switches back to Hook API tab', () => {
      act(() => {
        tree = renderer.create(<App />);
      });
      act(() => {
        pressButton(tree.root, 'Function API');
      });
      act(() => {
        pressButton(tree.root, 'Hook API');
      });
      const json = tree.toJSON();
      expect(treeContainsText(json, 'Update Status')).toBe(true);
      expect(treeContainsText(json, 'App Info')).toBe(false);
    });
  });

  // ── Hook API Tab ───────────────────────────────────────────────────────────

  describe('Hook API tab', () => {
    it('displays current version from hook state', () => {
      act(() => {
        tree = renderer.create(<App />);
      });
      const json = tree.toJSON();
      expect(treeContainsText(json, '1.0.0')).toBe(true);
      expect(treeContainsText(json, 'Not checked')).toBe(true);
    });

    it('calls checkUpdate when pressing Check for Updates', async () => {
      const mockCheckUpdate = jest.fn().mockResolvedValue(undefined);
      (mockLib.useAppUpdate as jest.Mock).mockReturnValue(
        createMockHookReturn({checkUpdate: mockCheckUpdate}),
      );

      act(() => {
        tree = renderer.create(<App />);
      });
      await act(async () => {
        pressButton(tree.root, 'Check for Updates');
      });
      expect(mockCheckUpdate).toHaveBeenCalled();
    });

    it('shows "Checking..." text when isChecking is true', () => {
      (mockLib.useAppUpdate as jest.Mock).mockReturnValue(
        createMockHookReturn({isChecking: true}),
      );

      act(() => {
        tree = renderer.create(<App />);
      });
      const json = tree.toJSON();
      expect(treeContainsText(json, 'Checking...')).toBe(true);
    });
  });

  // ── Function API: Sync Functions ───────────────────────────────────────────

  describe('Function API - sync functions', () => {
    beforeEach(() => {
      act(() => {
        tree = renderer.create(<App />);
      });
      act(() => {
        pressButton(tree.root, 'Function API');
      });
    });

    it('calls getCurrentVersion and logs result', () => {
      act(() => {
        pressButton(tree.root, 'getCurrentVersion()');
      });
      expect(mockLib.getCurrentVersion).toHaveBeenCalled();
      const json = tree.toJSON();
      expect(treeContainsText(json, 'getCurrentVersion()')).toBe(true);
    });

    it('calls getCurrentBuildNumber and logs result', () => {
      act(() => {
        pressButton(tree.root, 'getCurrentBuildNumber()');
      });
      expect(mockLib.getCurrentBuildNumber).toHaveBeenCalled();
      const json = tree.toJSON();
      expect(treeContainsText(json, 'getCurrentBuildNumber()')).toBe(true);
    });

    it('calls getPackageName and logs result', () => {
      act(() => {
        pressButton(tree.root, 'getPackageName()');
      });
      expect(mockLib.getPackageName).toHaveBeenCalled();
      const json = tree.toJSON();
      expect(treeContainsText(json, 'getPackageName()')).toBe(true);
    });

    it('calls getCountry and logs result', () => {
      act(() => {
        pressButton(tree.root, 'getCountry()');
      });
      expect(mockLib.getCountry).toHaveBeenCalled();
      const json = tree.toJSON();
      expect(treeContainsText(json, 'getCountry()')).toBe(true);
    });
  });

  // ── Function API: Async Functions ──────────────────────────────────────────

  describe('Function API - async functions', () => {
    beforeEach(() => {
      act(() => {
        tree = renderer.create(<App />);
      });
      act(() => {
        pressButton(tree.root, 'Function API');
      });
    });

    it('calls getLatestVersion and logs result', async () => {
      await act(async () => {
        pressButton(tree.root, 'getLatestVersion()');
      });
      expect(mockLib.getLatestVersion).toHaveBeenCalled();
      const json = tree.toJSON();
      expect(treeContainsText(json, 'getLatestVersion()')).toBe(true);
    });

    it('calls getStoreUrl and logs result', async () => {
      await act(async () => {
        pressButton(tree.root, 'getStoreUrl()');
      });
      expect(mockLib.getStoreUrl).toHaveBeenCalled();
      const json = tree.toJSON();
      expect(treeContainsText(json, 'getStoreUrl()')).toBe(true);
    });

    it('calls needUpdate without options', async () => {
      await act(async () => {
        pressButton(tree.root, 'needUpdate()');
      });
      expect(mockLib.needUpdate).toHaveBeenCalledWith(undefined);
    });

    it('calls needUpdate with depth option', async () => {
      await act(async () => {
        pressButton(tree.root, 'needUpdate({depth: 2})');
      });
      expect(mockLib.needUpdate).toHaveBeenCalledWith({depth: 2});
    });

    it('calls openStore', async () => {
      await act(async () => {
        pressButton(tree.root, 'openStore()');
      });
      expect(mockLib.openStore).toHaveBeenCalled();
    });
  });

  // ── Function API: iOS Functions ────────────────────────────────────────────

  describe('Function API - iOS functions', () => {
    it('calls getAppStoreInfo and logs result', async () => {
      act(() => {
        tree = renderer.create(<App />);
      });
      act(() => {
        pressButton(tree.root, 'Function API');
      });
      await act(async () => {
        pressButton(tree.root, 'getAppStoreInfo()');
      });
      expect(mockLib.getAppStoreInfo).toHaveBeenCalled();
      const json = tree.toJSON();
      expect(treeContainsText(json, 'getAppStoreInfo()')).toBe(true);
    });
  });

  // ── Function API: Android Functions ────────────────────────────────────────

  describe('Function API - Android functions', () => {
    beforeEach(() => {
      act(() => {
        tree = renderer.create(<App />);
      });
      act(() => {
        pressButton(tree.root, 'Function API');
      });
    });

    it('calls checkPlayStoreUpdate', async () => {
      await act(async () => {
        pressButton(tree.root, 'checkPlayStoreUpdate()');
      });
      expect(mockLib.checkPlayStoreUpdate).toHaveBeenCalled();
    });

    it('calls startInAppUpdate with FLEXIBLE type', async () => {
      await act(async () => {
        pressButton(tree.root, 'startInAppUpdate(FLEXIBLE)');
      });
      expect(mockLib.startInAppUpdate).toHaveBeenCalledWith(0);
    });

    it('calls startInAppUpdate with IMMEDIATE type', async () => {
      await act(async () => {
        pressButton(tree.root, 'startInAppUpdate(IMMEDIATE)');
      });
      expect(mockLib.startInAppUpdate).toHaveBeenCalledWith(1);
    });

    it('calls completeInAppUpdate', async () => {
      await act(async () => {
        pressButton(tree.root, 'completeInAppUpdate()');
      });
      expect(mockLib.completeInAppUpdate).toHaveBeenCalled();
    });

    it('subscribes to update events via addUpdateListener', () => {
      act(() => {
        pressButton(tree.root, 'Subscribe to Updates');
      });
      expect(mockLib.addUpdateListener).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('unsubscribes from update events', () => {
      const mockRemove = jest.fn();
      (mockLib.addUpdateListener as jest.Mock).mockReturnValue({
        remove: mockRemove,
      });

      act(() => {
        pressButton(tree.root, 'Subscribe to Updates');
      });
      act(() => {
        pressButton(tree.root, 'Unsubscribe');
      });
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  // ── Log Display ────────────────────────────────────────────────────────────

  describe('log display', () => {
    it('shows "No logs yet" initially', () => {
      act(() => {
        tree = renderer.create(<App />);
      });
      expect(treeContainsText(tree.toJSON(), 'No logs yet')).toBe(true);
    });

    it('removes "No logs yet" after a sync function call', () => {
      act(() => {
        tree = renderer.create(<App />);
      });
      act(() => {
        pressButton(tree.root, 'Function API');
      });
      act(() => {
        pressButton(tree.root, 'getCurrentVersion()');
      });
      const json = tree.toJSON();
      expect(treeContainsText(json, 'No logs yet')).toBe(false);
      expect(treeContainsText(json, 'getCurrentVersion()')).toBe(true);
    });

    it('shows log entries after async function call', async () => {
      act(() => {
        tree = renderer.create(<App />);
      });
      act(() => {
        pressButton(tree.root, 'Function API');
      });
      await act(async () => {
        pressButton(tree.root, 'getLatestVersion()');
      });
      const json = tree.toJSON();
      expect(treeContainsText(json, 'getLatestVersion()')).toBe(true);
      expect(treeContainsText(json, '2.0.0')).toBe(true);
    });
  });

  // ── Error Handling ─────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('logs error when sync function throws', () => {
      (mockLib.getCurrentVersion as jest.Mock).mockImplementation(() => {
        throw new Error('Sync failure');
      });

      act(() => {
        tree = renderer.create(<App />);
      });
      act(() => {
        pressButton(tree.root, 'Function API');
      });
      act(() => {
        pressButton(tree.root, 'getCurrentVersion()');
      });
      const json = tree.toJSON();
      expect(treeContainsText(json, 'error')).toBe(true);
      expect(treeContainsText(json, 'Sync failure')).toBe(true);
    });

    it('logs error when async function rejects', async () => {
      (mockLib.getLatestVersion as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );

      act(() => {
        tree = renderer.create(<App />);
      });
      act(() => {
        pressButton(tree.root, 'Function API');
      });
      await act(async () => {
        pressButton(tree.root, 'getLatestVersion()');
      });
      const json = tree.toJSON();
      expect(treeContainsText(json, 'error')).toBe(true);
      expect(treeContainsText(json, 'Network error')).toBe(true);
    });
  });
});
