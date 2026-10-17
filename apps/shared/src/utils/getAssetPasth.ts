import { Platform } from 'react-native'

export function getAssetPath(asset: string): string {
  return Platform.select({
    android: `custom/${asset}`,
    ios: asset,
  })!
}
