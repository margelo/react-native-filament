import { useEffect, useState } from 'react'
import { Asset } from '../native/FilamentBuffer'
import { FilamentProxy } from '../native/FilamentProxy'

export interface AssetProps {
  /**
   * A web URL (http:// or https://), local file (file://) or resource ID of the bundled asset.
   */
  path: string
}

/**
 * Asynchronously load an asset from the given web URL, local file path, or resource ID.
 */
export function useAsset({ path }: AssetProps): Asset | undefined {
  const [asset, setAsset] = useState<Asset>()

  useEffect(() => {
    FilamentProxy.loadAsset(path)
      .then((a) => setAsset(a))
      .catch((e) => console.error(`Failed to load asset ${path}!`, e))
  }, [path])

  return asset
}
