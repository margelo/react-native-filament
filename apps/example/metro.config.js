const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const path = require('path')
const fs = require('fs')

const root = path.resolve(__dirname, '..', '..')
const defaultConfig = getDefaultConfig(__dirname)
const sharedAssetNames = new Set(fs.readdirSync(path.join(root, 'apps', 'shared', 'assets')))

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
  watchFolders: [root],
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'glb', 'ktx', 'filamat'],
    nodeModulesPaths: [path.join(root, 'node_modules')],
    // Shared assets are served from this app's `assets` symlink so their URLs stay under /assets/.
    resolveRequest: (context, moduleName, platform) => {
      const fileName = path.basename(moduleName)
      if (!sharedAssetNames.has(fileName)) return context.resolveRequest(context, moduleName, platform)
      return { type: 'assetFiles', filePaths: [path.join(__dirname, 'assets', fileName)] }
    },
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
