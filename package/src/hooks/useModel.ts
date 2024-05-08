import { AssetProps, useAsset } from './useAsset'
import { FilamentAsset } from '../types/FilamentAsset'
import { useFilamentContext } from '../FilamentContext'
import { useDisposableResource } from './useDisposableResource'
import usePrevious from './usePrevious'
import { useWorkletEffect } from './useWorkletEffect'
import { AABB } from '../types'
import { useMemo } from 'react'

interface ModelProps extends AssetProps {
  /**
   * Whether source data of the model should be released after loading, or not.
   * @default false
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
 * Use a Filament Model that gets asynchronously loaded into the given Engine.
 * @worklet
 * @example
 * ```ts
 * const engine = useEngine()
 * const pengu = useModel({ engine: engine, path: PENGU_PATH })
 * ```
 */
export function useModel({ path, shouldReleaseSourceData, addToScene = true, instanceCount }: ModelProps): FilamentModel {
  const { engine, scene, _workletContext } = useFilamentContext()
  const assetBuffer = useAsset({ path: path, releaseOnUnmount: false })

  // Note: the native cleanup of the asset will remove it automatically from the scene
  const asset = useDisposableResource(() => {
    if (assetBuffer == null) return
    if (instanceCount === 0) {
      throw new Error('instanceCount must be greater than 0')
    }

    return _workletContext.runAsync(() => {
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
  }, [assetBuffer, _workletContext, engine, instanceCount])

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
