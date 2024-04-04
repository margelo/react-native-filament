import { useEffect, useMemo, useRef, useState } from 'react'
import { AssetProps, useAsset } from './useAsset'
import { Animator, Engine, Entity } from '../types'
import { FilamentAsset } from '../types/FilamentAsset'
import { useRenderableManager } from './useRenderableManager'
import { FilamentProxy } from '../native/FilamentProxy'

interface ModelProps extends AssetProps {
  /**
   * The Filament engine this model should be loaded into.
   */
  engine: Engine
  /**
   * Whether source data of the model should be released after loading, or not.
   * @default true
   */
  shouldReleaseSourceData?: boolean

  /**
   * Whether the model should be automatically added to the scene after loading.
   * @default true
   */
  autoAddToScene?: boolean

  /**
   * @default false
   */
  castShadow?: boolean

  /**
   * @default false
   */
  receiveShadow?: boolean

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
      animator: Animator
      asset: FilamentAsset
      entities: Entity[]
      renderableEntities: Entity[]
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
  castShadow,
  receiveShadow,
  instanceCount,
}: ModelProps): FilamentModel {
  const assetBuffer = useAsset({ path: path })
  const renderableManager = useRenderableManager(engine)
  const [asset, setAsset] = useState<FilamentAsset | undefined>(undefined)
  const context = useMemo(() => FilamentProxy.getWorkletContext(), [])

  useEffect(() => {
    const setAssetWorklet = Worklets.createRunInJsFn(setAsset)
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

      setAssetWorklet(loadedAsset)
    }, context)()
  }, [assetBuffer, context, engine, instanceCount])

  const animator = useMemo(() => {
    if (asset == null) return undefined
    return asset.getAnimator()
  }, [asset])

  const entities = useMemo(() => {
    if (asset == null) return undefined
    return asset.getEntities()
  }, [asset])

  const renderableEntities = useMemo(() => {
    if (asset == null) return undefined
    return asset.getRenderableEntities()
  }, [asset])

  useEffect(() => {
    if (shouldReleaseSourceData) {
      // releases CPU memory for bindings
      asset?.releaseSourceData()
    }
  }, [asset, shouldReleaseSourceData])

  useEffect(() => {
    if (!autoAddToScene || asset == null) {
      return
    }
    Worklets.createRunInContextFn(() => {
      'worklet'

      if (asset == null) return
      engine.getScene().addAssetEntities(asset)
    }, context)()

    return () => {
      Worklets.createRunInContextFn(() => {
        'worklet'

        if (asset == null) return
        engine.getScene().removeAssetEntities(asset)
      }, context)()
    }
  }, [autoAddToScene, engine, asset, context])

  const prevCastShadowRef = useRef(castShadow)
  useEffect(() => {
    prevCastShadowRef.current = castShadow

    Worklets.createRunInContextFn(() => {
      'worklet'

      if (asset == null) return
      const root = asset.getRoot()
      if (castShadow || prevCastShadowRef.current !== castShadow) {
        renderableManager.setCastShadow(root, true)
      }
    }, context)()
  }, [castShadow, asset, entities, renderableManager, context])

  const prevReceiveShadowRef = useRef(receiveShadow)
  useEffect(() => {
    prevReceiveShadowRef.current = receiveShadow

    Worklets.createRunInContextFn(() => {
      'worklet'

      if (asset == null) return
      const root = asset.getRoot()
      if (receiveShadow || prevReceiveShadowRef.current !== receiveShadow) {
        renderableManager.setReceiveShadow(root, true)
      }
    }, context)()
  }, [receiveShadow, asset, renderableManager, context])

  if (assetBuffer == null || asset == null || animator == null || entities == null || renderableEntities == null) {
    return {
      state: 'loading',
    }
  }
  return {
    state: 'loaded',
    asset: asset,
    animator: animator,
    entities: entities,
    renderableEntities: renderableEntities,
  }
}
