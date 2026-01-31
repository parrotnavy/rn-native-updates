export function compareVersions(
  version1: string,
  version2: string,
  depth: number = Number.POSITIVE_INFINITY,
): number {
  const v1Parts = version1.split('.').map((p) => Number.parseInt(p, 10) || 0);
  const v2Parts = version2.split('.').map((p) => Number.parseInt(p, 10) || 0);

  const maxLength = Math.min(Math.max(v1Parts.length, v2Parts.length), depth);

  for (let i = 0; i < maxLength; i++) {
    const v1 = v1Parts[i] ?? 0;
    const v2 = v2Parts[i] ?? 0;

    if (v1 > v2) return 1;
    if (v1 < v2) return -1;
  }

  return 0;
}

export function isNewerVersion(
  currentVersion: string,
  latestVersion: string,
  depth?: number,
): boolean {
  return compareVersions(latestVersion, currentVersion, depth) > 0;
}
