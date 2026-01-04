import { AppRegistry } from 'react-native'
import App from '@shared/src/App'
import { name as appName } from './app.json'
import { StrictMode } from 'react'

import { version } from 'react-native-worklets-core/package.json'
console.log(`Using react-native-worklets-core@${version}`)

// Setup a logger for filament
import { setLogger } from 'react-native-filament'
// A function that can wrap a console log call to add a prefix
const prefix = '[filament-logger]'
const prefixLog =
  (logFn) =>
  (...messages) => {
    const date = new Date()
    logFn(prefix, `[${date.toLocaleTimeString()} ${date.getMilliseconds().toString().padStart(3, 0)}]`, ...messages)
  }
setLogger({
  debug: prefixLog(console.debug),
  log: prefixLog(console.log),
  info: prefixLog(console.info),
  warn: prefixLog(console.warn),
  error: prefixLog(console.error),
})

// Run filament tests
import { runTests } from 'react-native-filament-test'
runTests()

AppRegistry.registerComponent(appName, () => () => (
  <StrictMode>
    <App />
  </StrictMode>
))
