import { type BufferSource, useBuffer } from './useBuffer'
import { FilamentAsset } from '../types/FilamentAsset'
import { useFilamentContext } from '../react/FilamentContext'
import { useDisposableResource } from './useDisposableResource'
import usePrevious from './usePrevious'
import { useWorkletEffect } from './useWorkletEffect'
import { AABB } from '../types'
import { useMemo } from 'react'

export interface ModelProps {
  /**
   * Whether source data of the model should be released after loading, or not.
   * @default true
   */
  shouldReleaseSourceData?: boolean

  /**
   * Whether the model should be added to the scene.
   * @default true
   */
  addToScene?: boolean

  /**
   * Number of instances to create.
   * @default 1
   */
  instanceCount?: number
}

/**
 * The resulting filament model, or `'loading'` if not yet available.
 */
export type FilamentModel =
  | {
      state: 'loaded'
      asset: FilamentAsset
      boundingBox: AABB
    }
  | {
      state: 'loading'
    }

/**
 * Loads a model from the given source.
 *
 *
 * If you are passing in a `.glb` model or similar from your app's bundle using `require(..)`, make sure to add `glb` as an asset extension to `metro.config.js`!
 * If you are passing in a `{ url: ... }`, make sure the URL points directly to a `.glb` model. This can either be a web URL (`http://..`/`https://..`), a local file (`file://..`), or an native asset path (`path/to/asset.glb`)
 *
 * @worklet
 * @example
 * ```ts
 * const model = useModel(require('model.glb'))
 * ```
 */
export function useModel(source: BufferSource, props?: ModelProps): FilamentModel {
  const { shouldReleaseSourceData = true, addToScene = true, instanceCount } = props ?? {}
  const { engine, scene, workletContext } = useFilamentContext()
  const assetBuffer = useBuffer({ source: source, releaseOnUnmount: false })

  // Note: the native cleanup of the asset will remove it automatically from the scene
  const asset = useDisposableResource(() => {
    if (assetBuffer == null) return
    if (instanceCount === 0) {
      throw new Error('instanceCount must be greater than 0')
    }

    return workletContext.runAsync(() => {
      'worklet'

      let loadedAsset: FilamentAsset
      if (instanceCount == null || instanceCount === 1) {
        loadedAsset = engine.loadAsset(assetBuffer)
      } else {
        loadedAsset = engine.loadInstancedAsset(assetBuffer, instanceCount)
      }

      // After loading the asset we can release the buffer
      assetBuffer.release()

      return loadedAsset
    })
  }, [assetBuffer, workletContext, engine, instanceCount])

  useWorkletEffect(() => {
    'worklet'
    if (asset == null || !shouldReleaseSourceData) {
      return
    }

    // releases CPU memory for bindings
    asset.releaseSourceData()
  })

  // Add or remove from the scene:
  const previousAddToScene = usePrevious(addToScene)
  useWorkletEffect(() => {
    'worklet'
    if (asset == null) return

    if (addToScene) {
      scene.addAssetEntities(asset)
    } else if (!addToScene && previousAddToScene) {
      // Only remove when it was previously added (ie. the user set addToScene: false)
      scene.removeAssetEntities(asset)
    }
  })

  const boundingBox = useMemo(() => {
    if (asset == null) return undefined
    return asset.boundingBox
  }, [asset])

  if (assetBuffer == null || asset == null || boundingBox == null) {
    return {
      state: 'loading',
    }
  }
  return {
    state: 'loaded',
    asset: asset,
    boundingBox: boundingBox,
  }
}
