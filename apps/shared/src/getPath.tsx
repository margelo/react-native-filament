import { Platform } from 'react-native'

export const getPath = (path: string) => {
  if (Platform.OS === 'android') {
    // TODO: Right now we bundle the asset using react-native-asset, which on android adds a custom/ prefix
    // Fix by implementing proper asset loading, see: https://github.com/margelo/react-native-filament/issues/61
    return `custom/${path}`
  }
  return path
}
