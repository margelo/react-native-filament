import type { AssetLike } from './AssetLike'

/** A value that stays equal while `asset` names the same asset, for hook dependencies. */
export function assetKey(asset: AssetLike): number | string | ArrayBuffer {
  if (typeof asset === 'number' || typeof asset === 'string' || asset instanceof ArrayBuffer) return asset
  return asset.uri
}
