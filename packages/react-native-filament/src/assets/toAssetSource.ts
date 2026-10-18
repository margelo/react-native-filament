import { Image } from 'react-native'
import type { AssetSource } from '../specs/types/AssetSource'
import type { AssetLike } from './AssetLike'

export function toAssetSource(asset: AssetLike): AssetSource {
  if (typeof asset === 'number') return { uri: Image.resolveAssetSource(asset).uri }
  if (typeof asset === 'string') return { uri: asset }
  return asset
}
