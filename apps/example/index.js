import { AppRegistry } from 'react-native'
import { StrictMode } from 'react'
import App from 'shared/src/App'
import { name as appName } from './app.json'

AppRegistry.registerComponent(appName, () => () => (
  <StrictMode>
    <App />
  </StrictMode>
))
