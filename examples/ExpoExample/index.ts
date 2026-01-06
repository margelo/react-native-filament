import { registerRootComponent } from 'expo';

import App from '@shared/src/App'

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
    logFn(prefix, `[${date.toLocaleTimeString()} ${date.getMilliseconds().toString().padStart(3, '0')}]`, ...messages)
  }
setLogger({
  debug: prefixLog(console.debug),
  info: prefixLog(console.info),
  warn: prefixLog(console.warn),
  error: prefixLog(console.error),
})

// Run filament tests
import { runTests } from 'react-native-filament-test'
runTests()

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

