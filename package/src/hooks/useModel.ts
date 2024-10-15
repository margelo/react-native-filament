import { type BufferSource, useBuffer } from './useBuffer'
import { FilamentAsset } from '../types/FilamentAsset'
import { useFilamentContext } from './useFilamentContext'
import { useDisposableResource } from './useDisposableResource'
import usePrevious from './usePrevious'
import { useWorkletEffect } from './useWorkletEffect'
import { AABB, Entity } from '../types'
import { useMemo } from 'react'
import { NitroBoxed } from '../native/FilamentProxy'
import { BoxedHybridObject } from 'react-native-nitro-modules/lib/BoxedHybridObject'
import { NitroModules } from 'react-native-nitro-modules'

export interface UseModelConfigParams {
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
      asset: BoxedHybridObject<FilamentAsset>
      boundingBox: BoxedHybridObject<AABB>
      /**
       * The root entity of the model.
       */
      rootEntity: BoxedHybridObject<Entity>
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
export function useModel(source: BufferSource, props?: UseModelConfigParams): FilamentModel {
  const { shouldReleaseSourceData = true, addToScene = true, instanceCount } = props ?? {}
  const { engine, scene, workletContext } = useFilamentContext()
  const rawAssetBuffer = useBuffer({ source: source, releaseOnUnmount: false })
  const boxedAssetBuffer = rawAssetBuffer == null ? undefined : NitroModules.box(rawAssetBuffer)

  // Note: the native cleanup of the asset will remove it automatically from the scene
  const asset = useDisposableResource(() => {
    if (boxedAssetBuffer == null) return
    if (instanceCount === 0) {
      throw new Error('instanceCount must be greater than 0')
    }

    return workletContext.runAsync(() => {
      'worklet'

      let loadedAsset: FilamentAsset
      const unboxedEngine = engine.unbox()
      const assetBuffer = boxedAssetBuffer.unbox()
      if (instanceCount == null || instanceCount === 1) {
        loadedAsset = unboxedEngine.loadAsset(assetBuffer)
      } else {
        loadedAsset = unboxedEngine.loadInstancedAsset(assetBuffer, instanceCount)
      }

      // After loading the asset we can release the buffer
      assetBuffer.release()

      const nitro = NitroBoxed.unbox()
      const boxedAsset = nitro.box(loadedAsset)
      return boxedAsset
    })
  }, [boxedAssetBuffer, instanceCount, workletContext, engine])

  useWorkletEffect(() => {
    'worklet'
    if (asset == null || !shouldReleaseSourceData) {
      return
    }

    // releases CPU memory for bindings
    asset.unbox().releaseSourceData()
  })

  // Add or remove from the scene:
  const previousAddToScene = usePrevious(addToScene)
  useWorkletEffect(() => {
    'worklet'
    if (asset == null) return

    const unboxedScene = scene.unbox()
    const unboxedAsset = asset.unbox()
    if (addToScene) {
      unboxedScene.addAssetEntities(unboxedAsset)
    } else if (!addToScene && previousAddToScene) {
      // Only remove when it was previously added (ie. the user set addToScene: false)
      unboxedScene.removeAssetEntities(unboxedAsset)
    }
  })

  const boundingBox = useMemo(() => {
    if (asset == null) return undefined
    return NitroModules.box(asset.unbox().getBoundingBox())
  }, [asset])

  const rootEntity = useMemo(() => {
    if (asset == null) {
      return null
    }
    return NitroModules.box(asset.unbox().getRoot())
  }, [asset])

  if (rawAssetBuffer == null || asset == null || boundingBox == null || rootEntity == null) {
    console.log({
      rawAssetBuffer,
      asset,
      boundingBox,
      rootEntity,
    })
    return {
      state: 'loading',
    }
  }
  return {
    state: 'loaded',
    asset: asset,
    rootEntity: rootEntity,
    boundingBox: boundingBox,
  }
}
