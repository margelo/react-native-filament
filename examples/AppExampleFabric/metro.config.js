const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const path = require('path')
const pak = require('../../package.json')

const root = path.resolve(__dirname, '..', '..')
const modules = Object.keys({ ...pak.peerDependencies })

const defaultConfig = getDefaultConfig(__dirname)

const assetExts = [...defaultConfig.resolver.assetExts, 'glb', 'ktx', 'filamat']
const assetPath = path.join(__dirname, '..', 'Shared', 'assets')
const assetFilesMap = {}

// Read all assets from shared code
const fs = require('fs')
fs.readdirSync(assetPath).forEach(file => {
  assetFilesMap[file] = path.join(assetPath, file)
})

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [root],

  resolver: {
    assetExts: assetExts,
    // We need to make sure that only one version is loaded for peerDependencies
    // So we block them at the root, and alias them to the versions in example's node_modules
    extraNodeModules: modules.reduce((acc, name) => {
      acc[name] = path.join(__dirname, 'node_modules', name)
      return acc
    }, {
      "react-native-filament-test": path.resolve(root, 'package', 'src', 'test', 'RunTests'),
    }),

    resolveRequest: (context, moduleName, platform) => {
      const baseFileName = path.basename(moduleName);
      if (!assetFilesMap[baseFileName]) {
        return context.resolveRequest(context, moduleName, platform);
      }
    
      // The code is in Shared, when bundling the app code the path to our asset would point to "../Shared/assets/{name}"
      // This would result in a metro server call to: http://server/assets/../Shared/assets/{name}, which will decode to:
      // http://server/Shared/assets/{name}. Metro expects assets to be requested from /assets/ and thus this would fail.
      // To fix this I symlink the assets into the example's asset folder and point to that location here.
      return {
        type: 'assetFiles',
        filePaths: [
          path.resolve(__dirname, 'assets', baseFileName),
        ]
      }
    }
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