const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path')

const root = path.resolve(__dirname, '..', '..')

const defaultConfig = getDefaultConfig(__dirname)
/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [root],

  resolver: {
    assetExts: ['glb', 'ktx', 'filamat', ...defaultConfig.resolver.assetExts],
  },
};

module.exports = mergeConfig(defaultConfig, config);
