const path = require('path')
const pak = require('../../package.json')

const sharedPath = path.join(__dirname, '..', 'Shared')

const aliasMap = {
  [pak.name]: path.join(__dirname, '..', '..', pak.source),
  [pak.name + '-test']: path.join(__dirname, '..', '..', pak.test),
  '@shared': sharedPath,
  '~/assets': path.join(sharedPath, 'assets'),
}

  /** @type {import('react-native-worklets/plugin').PluginOptions} */
  const workletsPluginOptions = {
  }

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: aliasMap,
      },
    ],
    ['react-native-worklets/plugin', workletsPluginOptions],
  ]
};
