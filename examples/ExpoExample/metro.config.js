// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

const path = require('path')
const pak = require('../../package/package.json')
const escape = require('escape-string-regexp')

const root = path.resolve(__dirname, '..', '..')
const modules = Object.keys({ ...pak.peerDependencies })

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname)

const assetExts = [...defaultConfig.resolver.assetExts, 'glb', 'ktx', 'filamat']
const assetPath = path.join(__dirname, '..', 'Shared', 'assets')
const assetFilesMap = {}

// Read all assets from shared code
const fs = require('fs')
fs.readdirSync(assetPath).forEach(file => {
  assetFilesMap[file] = path.join(assetPath, file)
})

// Project's node modules list
const nodeModulePath = path.resolve(__dirname, "node_modules")
const projectNodeModulesMap = {}
fs.readdirSync(nodeModulePath).forEach(file => {
  projectNodeModulesMap[file] = path.join(nodeModulePath, file)
})

/** @type {import('expo/metro-config').MetroConfig} */
const config = {
  watchFolders: [root],

  resolver: {
    assetExts: assetExts,

    // Block peer dependencies from workspace root to prevent duplicate bundling
    // Only block modules that exist in the example's node_modules
    blockList: modules
      .filter(m => projectNodeModulesMap[m])
      .map(m => new RegExp(`^${escape(path.join(root, 'node_modules', m))}\\/.*$`)
    ),
    resolveRequest: (context, moduleName, platform) => {
      const baseFileName = path.basename(moduleName);

      // Only handle asset files with custom resolution
      if (assetFilesMap[baseFileName]) {
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

      // Check if this module should be redirected via extraNodeModules
      // We need to manually handle this since we have a custom resolveRequest
      if (projectNodeModulesMap[moduleName]) {
        return context.resolveRequest(context, projectNodeModulesMap[moduleName], platform);
      }

      // For everything else, let Metro's default resolver handle it
      return context.resolveRequest(context, moduleName, platform);
    }
  },
};

module.exports = mergeConfig(defaultConfig, config);
