const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pak = require(path.join(root, 'package.json'));

// Peer dependencies must resolve to the example app's single copy
// to prevent "Invalid hook call" from duplicate React instances.
const peerDeps = Object.keys(pak.peerDependencies || {});

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const config = {
  watchFolders: [root],
  resolver: {
    unstable_enableSymlinks: true,
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(root, 'node_modules'),
    ],
    blockList: peerDeps.map(
      m =>
        new RegExp(
          `^${escapeRegExp(path.resolve(root, 'node_modules', m))}\\/.*$`,
        ),
    ),
    extraNodeModules: peerDeps.reduce((acc, name) => {
      acc[name] = path.resolve(__dirname, 'node_modules', name);
      return acc;
    }, {}),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
