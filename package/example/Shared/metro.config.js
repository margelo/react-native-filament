const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const path = require('path')

const root = path.resolve(__dirname, '..', '..')

const defaultConfig = getDefaultConfig(__dirname)

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [root],

  resolver: {
    assetExts: ['glb', 'ktx', 'matc', ...defaultConfig.resolver.assetExts],
  },

  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
}

module.exports = mergeConfig(defaultConfig, config)
