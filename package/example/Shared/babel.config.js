const path = require('path')
const pak = require('../../package.json')

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: {
          [pak.name]: path.join(__dirname, '..', '..', pak.source),
          [pak.name + '-test']: path.join(__dirname, '..', '..', pak.test),
          '~/assets': path.join(__dirname, 'assets'),
        },
      },
    ],
    ['react-native-reanimated/plugin', { processNestedWorklets: true }],
  ],
}
