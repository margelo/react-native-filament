const path = require('path')
const pak = require('../../package.json')

const aliasMap = {
  [pak.name]: path.join(__dirname, '..', '..', pak.source),
  [pak.name + '-test']: path.join(__dirname, '..', '..', pak.test),
  '~/assets': path.join(__dirname, 'assets'),
}

if (process.env.IS_NEW_ARCH === 'false') {
  aliasMap['react-native-worklets-core'] = path.join(__dirname, '..', 'AppExamplePaper', 'node_modules', 'react-native-worklets-core')
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
    ['react-native-reanimated/plugin', { processNestedWorklets: true }],
  ],
}
