import { useEffect, useMemo, useState } from 'react'
import { FilamentBuffer } from '../types/FilamentBuffer.nitro'
import { FilamentProxy } from '../native/FilamentProxy'
import { withCleanupScope } from '../utilities/withCleanupScope'
import { Image } from 'react-native'

// In React Native, `require(..)` returns a number.
type Require = number // ReturnType<typeof require>
export type BufferSource =
  | Require
  | {
      /**
       * A web URL (http:// or https://), local file (file://) or asset path of the bundled asset.
       */
      uri: string
    }

export interface BufferProps {
  /**
   * If you are passing in a `.glb` model or similar from your app's bundle using `require(..)`, make sure to add `glb` as an asset extension to `metro.config.js`!
   * If you are passing in a `{ url: ... }`, make sure the URL points directly to a `.glb` model. This can either be a web URL (`http://..`/`https://..`), a local file (`file://..`), or an native asset path (`path/to/asset.glb`)
   */
  source: BufferSource

  /**
   * @default true
   */
  releaseOnUnmount?: boolean
}

/**
 * Asynchronously load an asset from the given web URL, local file path, or resource ID.
 */
export function useBuffer({ source: source, releaseOnUnmount = true }: BufferProps): FilamentBuffer | undefined {
  const [buffer, setBuffer] = useState<FilamentBuffer | undefined>(undefined)

  const uri = useMemo(() => {
    if (typeof source === 'object') {
      return source.uri
    }

    const asset = Image.resolveAssetSource(source)
    if (asset == null) {
      throw new Error(
        `Failed to load source: ${source}. Are you sure that\n-The asset exists on this path?\n-The metro bundler is configured correctly as explained in the documentation?`
      )
    }

    return asset.uri
  }, [source])

  // TODO: useDisposableResource
  useEffect(() => {
    let localBuffer: FilamentBuffer | undefined
    FilamentProxy.loadAsset(uri)
      .then((asset) => {
        localBuffer = asset
        setBuffer(asset)
      })
      .catch((error) => {
        console.error(`Failed to load asset: ${uri}`, error)
      })
    return withCleanupScope(() => {
      if (releaseOnUnmount) {
        localBuffer?.release()
      }
    })
  }, [releaseOnUnmount, uri])

  return buffer
}
