const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')
const fs = require('fs')

const root = path.resolve(__dirname, '..', '..')
const config = getDefaultConfig(__dirname)
const sharedAssetNames = new Set(fs.readdirSync(path.join(root, 'apps', 'shared', 'assets')))

config.resolver.assetExts = [...config.resolver.assetExts, 'glb', 'ktx', 'filamat']
// Shared assets are served from this app's `assets` symlink so their URLs stay under /assets/.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const fileName = path.basename(moduleName)
  if (!sharedAssetNames.has(fileName)) return context.resolveRequest(context, moduleName, platform)
  return { type: 'assetFiles', filePaths: [path.join(__dirname, 'assets', fileName)] }
}

module.exports = config
