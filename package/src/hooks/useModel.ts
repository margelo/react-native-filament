import { useEffect, useMemo, useRef } from 'react'
import { AssetProps, useAsset } from './useAsset'
import { Animator, Engine, Entity } from '../types'
import { FilamentAsset } from '../types/FilamentAsset'
import { useRenderableManager } from './useRenderableManager'

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
  const asset = useAsset({ path: path })
  const renderableManager = useRenderableManager(engine)

  const engineAsset = useMemo(() => {
    if (asset == null) return undefined
    if (instanceCount == null || instanceCount === 1) {
      return engine.loadAsset(asset)
    } else {
      return engine.loadInstancedAsset(asset, instanceCount)
    }
  }, [asset, engine, instanceCount])

  const animator = useMemo(() => engineAsset?.getAnimator(), [engineAsset])

  const entities = useMemo(() => {
    if (engineAsset == null) return undefined
    return engineAsset.getEntities()
  }, [engineAsset])

  const renderableEntities = useMemo(() => {
    if (engineAsset == null) return undefined
    return engineAsset.getRenderableEntities()
  }, [engineAsset])

  useEffect(() => {
    if (shouldReleaseSourceData) {
      // releases CPU memory for bindings
      engineAsset?.releaseSourceData()
    }
  }, [engineAsset, shouldReleaseSourceData])

  useEffect(() => {
    if (!autoAddToScene) {
      return
    }
    if (engineAsset == null) return
    engine.getScene().addAssetEntities(engineAsset)
  }, [autoAddToScene, engine, engineAsset, entities])

  const prevCastShadowRef = useRef(castShadow)
  useEffect(() => {
    if (engineAsset == null) return
    prevCastShadowRef.current = castShadow

    const root = engineAsset.getRoot()
    if (castShadow || prevCastShadowRef.current !== castShadow) {
      renderableManager.setCastShadow(root, true)
    }
  }, [castShadow, engineAsset, entities, renderableManager])

  const prevReceiveShadowRef = useRef(receiveShadow)
  useEffect(() => {
    if (engineAsset == null) return
    prevReceiveShadowRef.current = receiveShadow

    const root = engineAsset.getRoot()
    if (receiveShadow || prevReceiveShadowRef.current !== receiveShadow) {
      renderableManager.setReceiveShadow(root, true)
    }
  }, [receiveShadow, engineAsset, renderableManager])

  if (asset == null || engineAsset == null || animator == null || entities == null || renderableEntities == null) {
    return {
      state: 'loading',
    }
  }
  return {
    state: 'loaded',
    asset: engineAsset,
    animator: animator,
    entities: entities,
    renderableEntities: renderableEntities,
  }
}
