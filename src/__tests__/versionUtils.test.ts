import { compareVersions, isNewerVersion } from '../versionUtils';

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });

  it('returns positive when first is newer', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0);
    expect(compareVersions('1.1.0', '1.0.0')).toBeGreaterThan(0);
    expect(compareVersions('1.0.1', '1.0.0')).toBeGreaterThan(0);
  });

  it('returns negative when first is older', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
    expect(compareVersions('1.0.0', '1.1.0')).toBeLessThan(0);
    expect(compareVersions('1.0.0', '1.0.1')).toBeLessThan(0);
  });

  it('handles different segment counts', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.0', '1.0')).toBe(0);
    expect(compareVersions('1.0.1', '1.0')).toBeGreaterThan(0);
  });

  it('respects depth parameter', () => {
    expect(compareVersions('1.2.3', '1.2.4', 2)).toBe(0);
    expect(compareVersions('1.2.3', '1.3.0', 1)).toBe(0);
    expect(compareVersions('2.0.0', '1.9.9', 1)).toBeGreaterThan(0);
  });

  it('handles versions with non-numeric parts', () => {
    expect(compareVersions('1.0.0-beta', '1.0.0')).toBe(0);
  });
});

describe('isNewerVersion', () => {
  it('returns true when latest is newer', () => {
    expect(isNewerVersion('1.0.0', '2.0.0')).toBe(true);
    expect(isNewerVersion('1.0.0', '1.1.0')).toBe(true);
    expect(isNewerVersion('1.0.0', '1.0.1')).toBe(true);
  });

  it('returns false when versions are equal', () => {
    expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false);
  });

  it('returns false when latest is older', () => {
    expect(isNewerVersion('2.0.0', '1.0.0')).toBe(false);
  });

  it('respects depth parameter', () => {
    expect(isNewerVersion('1.0.0', '1.0.1', 2)).toBe(false);
    expect(isNewerVersion('1.0.0', '1.1.0', 2)).toBe(true);
  });

  it('handles real-world versions', () => {
    expect(isNewerVersion('2.1.4', '2.2.0')).toBe(true);
    expect(isNewerVersion('10.0.0', '9.9.9')).toBe(false);
  });

  it('handles empty strings', () => {
    expect(isNewerVersion('', '1.0.0')).toBe(true);
    expect(isNewerVersion('1.0.0', '')).toBe(false);
    expect(isNewerVersion('', '')).toBe(false);
  });

  it('handles versions with trailing dots', () => {
    expect(isNewerVersion('1.0.', '1.0.1')).toBe(true);
    expect(isNewerVersion('1.0.1', '1.0.')).toBe(false);
  });

  it('handles large depths', () => {
    expect(isNewerVersion('1.0.0', '1.0.0.1', 100)).toBe(true);
  });
});
