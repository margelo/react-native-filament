import { useEffect, useMemo, useState } from 'react'
import { AssetProps, useAsset } from './useAsset'
import { Engine } from '../types'
import { FilamentAsset } from '../types/FilamentAsset'
import { FilamentProxy } from '../native/FilamentProxy'
import { useScene } from './useScene'

interface ModelProps extends AssetProps {
  /**
   * The Filament engine this model should be loaded into.
   */
  engine: Engine
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
  engine,
  shouldReleaseSourceData,
  autoAddToScene = true,
  instanceCount,
  cleanupOnUnmount = true,
}: ModelProps): FilamentModel {
  const assetBuffer = useAsset({ path: path })
  const [asset, setAsset] = useState<FilamentAsset | undefined>(undefined)
  const context = useMemo(() => FilamentProxy.getWorkletContext(), [])

  useEffect(() => {
    Worklets.createRunInContextFn(() => {
      'worklet'
      if (assetBuffer == null) return
      if (instanceCount === 0) {
        throw new Error('instanceCount must be greater than 0')
      }

      let loadedAsset: FilamentAsset
      if (instanceCount == null || instanceCount === 1) {
        loadedAsset = engine.loadAsset(assetBuffer)
      } else {
        loadedAsset = engine.loadInstancedAsset(assetBuffer, instanceCount)
      }

      return loadedAsset
    }, context)().then(setAsset)
  }, [assetBuffer, context, engine, instanceCount])

  useEffect(() => {
    if (asset == null || !shouldReleaseSourceData) {
      return
    }
    Worklets.createRunInContextFn(() => {
      'worklet'

      // releases CPU memory for bindings
      asset?.releaseSourceData()
    }, context)()
  }, [asset, context, shouldReleaseSourceData])

  // Auto add asset to scene:
  const scene = useScene(engine)
  useEffect(() => {
    if (!autoAddToScene || asset == null) {
      return
    }

    Worklets.createRunInContextFn(() => {
      'worklet'

      if (asset == null) return
      scene.addAssetEntities(asset)
    }, context)()

    return () => {
      Worklets.createRunInContextFn(() => {
        'worklet'

        if (asset == null) return
        scene.removeAssetEntities(asset)
      }, context)()
    }
  }, [autoAddToScene, asset, context, engine, scene])

  // Cleanup native memory when unmounting:
  useEffect(() => {
    if (!cleanupOnUnmount) return
    return () => {
      assetBuffer?.release()
    }
  }, [cleanupOnUnmount, assetBuffer])
  // Release native memory when the component unmounts
  useEffect(() => {
    if (!cleanupOnUnmount) return
    return () => {
      asset?.release()
    }
  }, [cleanupOnUnmount, asset])

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
