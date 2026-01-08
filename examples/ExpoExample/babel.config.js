const path = require('path')

const aliasMap = {
  '@assets': path.join(__dirname, '..', 'Shared', 'assets'),
}

/** @type {import('react-native-worklets/plugin').PluginOptions} */
const workletsPluginOptions = {}

module.exports = {
  presets: ['babel-preset-expo'],
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
