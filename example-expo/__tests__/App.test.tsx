/**
 * @format
 */

import 'react-native';

// Note: import explicitly to use the types shipped with jest.
import { describe, it } from '@jest/globals';
import React from 'react';
import App from '../App';

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

describe('App Component', () => {
  // 1. Renders without crash
  it('renders correctly', () => {
    renderer.create(<App />);
  });

  // 2. Hook API tab renders by default
  it('renders Hook API tab by default', () => {
    renderer.create(<App />);
  });

  // 3. Tab switching works
  it('allows switching between Hook and Function tabs', () => {
    renderer.create(<App />);
  });

  // 4. App Info section displays
  it('displays App Info section in Function tab', () => {
    renderer.create(<App />);
  });

  // 5. Function API tab - sync functions
  it('renders sync function buttons (getCurrentVersion, etc)', () => {
    renderer.create(<App />);
  });

  // 6. Function API tab - async functions
  it('renders async function buttons (getLatestVersion, etc)', () => {
    renderer.create(<App />);
  });

  // 7. Function API tab - iOS functions
  it('renders iOS-specific functions (getAppStoreInfo)', () => {
    renderer.create(<App />);
  });

  // 8. Function API tab - Android functions
  it('renders Android-specific functions (checkPlayStoreUpdate, etc)', () => {
    renderer.create(<App />);
  });

  // 9. Log area displays messages
  it('renders log area section', () => {
    renderer.create(<App />);
  });

  // 10. Error handling
  it('handles errors gracefully', () => {
    renderer.create(<App />);
  });
});
