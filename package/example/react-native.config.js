const path = require('path')
const pak = require('../package.json')

module.exports = {
  dependencies: {
    [pak.name]: {
      root: path.join(__dirname, '..'),
    },
    ['react-native-worklets-core']: {
      root: path.join(__dirname, 'node_modules', 'react-native-worklets-core'),
    },
  },
  assets: ['./assets'],
}
