import { useEffect, useState } from 'react'
import { AssetProps, useAsset } from './useAsset'
import { FilamentAsset } from '../types/FilamentAsset'
import { useFilamentContext } from '../FilamentContext'
import { prepareForCleanup } from '../utilities/prepareForCleanup'

interface ModelProps extends AssetProps {
  /**
   * Whether source data of the model should be released after loading, or not.
   * @default false
   */
  shouldReleaseSourceData?: boolean

  /**
   * Whether the model should be automatically added to the scene after loading.
   * @default true
   */
  autoAddToScene?: boolean

  /**
   * Number of instances to create.
   * @default 1
   */
  instanceCount?: number

  /**
   * Whether to cleanup the native memory associated with the asset when the component unmounts.
   * @default true
   */
  cleanupOnUnmount?: boolean
}

/**
 * The resulting filament model, or `'loading'` if not yet available.
 */
export type FilamentModel =
  | {
      state: 'loaded'
      asset: FilamentAsset
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
export function useModel({
  path,
  shouldReleaseSourceData,
  autoAddToScene = true,
  instanceCount,
  cleanupOnUnmount = true,
}: ModelProps): FilamentModel {
  const { engine, scene, _workletContext } = useFilamentContext()
  const assetBuffer = useAsset({ path: path })
  const [asset, setAsset] = useState<FilamentAsset | undefined>(undefined)

  useEffect(() => {
    if (assetBuffer == null) return
    if (instanceCount === 0) {
      throw new Error('instanceCount must be greater than 0')
    }

    let currentAsset: FilamentAsset | undefined
    Worklets.createRunInContextFn(() => {
      'worklet'

      let loadedAsset: FilamentAsset
      if (instanceCount == null || instanceCount === 1) {
        loadedAsset = engine.loadAsset(assetBuffer)
      } else {
        loadedAsset = engine.loadInstancedAsset(assetBuffer, instanceCount)
      }

      return loadedAsset
    }, _workletContext)().then((loadedAsset) => {
      setAsset(loadedAsset)
      currentAsset = loadedAsset
    })

    if (!cleanupOnUnmount) return

    // Run the cleanup for the asset in the same useEffect creating the asset.
    // This ensures that the cleanup is only called once, even when there is a fast-refresh.
    return prepareForCleanup(() => {
      if (currentAsset != null) {
        currentAsset.release()
      }
    })
  }, [assetBuffer, _workletContext, engine, instanceCount, cleanupOnUnmount, path])

  useEffect(() => {
    if (asset == null || !shouldReleaseSourceData) {
      return
    }
    Worklets.createRunInContextFn(() => {
      'worklet'

      // releases CPU memory for bindings
      asset?.releaseSourceData()
    }, _workletContext)()
  }, [asset, _workletContext, shouldReleaseSourceData])

  // Auto add asset to scene:
  useEffect(() => {
    if (!autoAddToScene || asset == null) {
      return
    }

    Worklets.createRunInContextFn(() => {
      'worklet'

      scene.addAssetEntities(asset)
    }, _workletContext)()

    if (cleanupOnUnmount) {
      // asset.release() will cause the asset to be removed from the scene internally
      return
    }
    return () => {
      Worklets.createRunInContextFn(() => {
        'worklet'

        scene.removeAssetEntities(asset)
      }, _workletContext)()
    }
  }, [autoAddToScene, asset, _workletContext, engine, scene, cleanupOnUnmount])

  // Cleanup native memory when unmounting:
  useEffect(() => {
    return () => {
      assetBuffer?.release()
    }
  }, [assetBuffer])

  if (assetBuffer == null || asset == null) {
    return {
      state: 'loading',
    }
  }
  return {
    state: 'loaded',
    asset: asset,
  }
}
