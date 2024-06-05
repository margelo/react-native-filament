import { AppRegistry } from 'react-native'
import App from './src/App'
import { name as appName } from './app.json'
import { StrictMode } from 'react'

import { version } from 'react-native-worklets-core/package.json'
console.log(`Using react-native-worklets-core@${version}`)

// Run filament tests
import { runTests } from 'react-native-filament-test'
runTests()

AppRegistry.registerComponent(appName, () => () => (
  <StrictMode>
    <App />
  </StrictMode>
))
