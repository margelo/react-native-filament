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
   * @default true
   */
  releaseOnUnmount?: boolean
}

/**
 * Asynchronously load an asset from the given web URL, local file path, or resource ID.
 */
export function useAsset({ path, releaseOnUnmount = true }: AssetProps): Asset | undefined {
  const [buffer, setBuffer] = useState<Asset | undefined>(undefined)
  useEffect(() => {
    let localBuffer: Asset | undefined
    FilamentProxy.loadAsset(path).then((asset) => {
      localBuffer = asset
      setBuffer(asset)
    })
    return withCleanupScope(() => {
      if (releaseOnUnmount) {
        localBuffer?.release()
      }
    })
  }, [path, releaseOnUnmount])

  return buffer
}
