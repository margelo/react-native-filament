const path = require('path')
const pak = require('../package.json')

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: {
          [pak.name]: path.join(__dirname, '..', pak.source),
          [pak.name + '-test']: path.join(__dirname, '..', pak.test),
        },
      },
    ],
    ['react-native-worklets-core/plugin', { processNestedWorklets: true }],
  ],
}
