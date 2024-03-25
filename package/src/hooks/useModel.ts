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
}: ModelProps): FilamentModel {
  const asset = useAsset({ path: path })
  const renderableManager = useRenderableManager(engine)

  const engineAsset = useMemo(() => {
    if (asset == null) return undefined
    return engine.loadAsset(asset)
  }, [asset, engine])

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
      renderableManager.setCastShadow(true, root)
    }
  }, [castShadow, engineAsset, renderableManager])

  const prevReceiveShadowRef = useRef(receiveShadow)
  useEffect(() => {
    if (engineAsset == null) return
    prevReceiveShadowRef.current = receiveShadow

    const root = engineAsset.getRoot()
    if (receiveShadow || prevReceiveShadowRef.current !== receiveShadow) {
      renderableManager.setReceiveShadow(true, root)
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
