// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

const path = require('path')

const root = path.resolve(__dirname, '..', '..')

const thisNodeModules = path.resolve(__dirname, 'node_modules');

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname)

const assetExts = [...defaultConfig.resolver.assetExts, 'glb', 'ktx', 'filamat']

/** @type {import('expo/metro-config').MetroConfig} */
const config = {
  // watchFolders: [root],
  

  resolver: {
    assetExts: assetExts,
    extraNodeModules: {
      'react-native-filament': path.resolve(root, 'src'),
    },
    resolveRequest: (context, moduleName, platform) => {
      if (!assetExts.some(ext => moduleName.endsWith('.' + ext))) {
        return context.resolveRequest(context, moduleName, platform);
      }

      return {
        type: 'assetFiles',
        filePaths: [
          path.resolve(root, 'assets', moduleName),
        ]
      }
    }
  },
};

module.exports = mergeConfig(defaultConfig, config);
