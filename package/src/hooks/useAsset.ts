import { useEffect, useState } from 'react'
import { Asset } from '../native/FilamentBuffer'
import { FilamentProxy } from '../native/FilamentProxy'
import { withCleanupScope } from '../utilities/withCleanupScope'

export interface AssetProps {
  /**
   * A web URL (http:// or https://), local file (file://) or resource ID of the bundled asset.
   */
  path: string

  /**
   * Will release native memory when the useAsset hook is unmounted.
   * You can't use the asset after it's been released.
   * @default true
   */
  cleanupOnUnmount?: boolean
}

/**
 * Asynchronously load an asset from the given web URL, local file path, or resource ID.
 */
export function useAsset({ path, cleanupOnUnmount = true }: AssetProps): Asset | undefined {
  // Reset the asset buffer when fast refreshing (as a useEffect might call .release())
  // @refresh reset
  const [asset, setAsset] = useState<Asset>()

  useEffect(() => {
    let localAsset: Asset | undefined
    FilamentProxy.loadAsset(path)
      .then((a) => {
        localAsset = a
        setAsset(a)
      })
      .catch((e) => console.error(`Failed to load asset ${path}!`, e))

    return withCleanupScope(() => {
      if (localAsset != null && cleanupOnUnmount) {
        localAsset.release()
      }
    })
  }, [path, cleanupOnUnmount])

  return asset
}
