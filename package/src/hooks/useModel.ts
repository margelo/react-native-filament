import { useEffect, useMemo, useRef } from 'react'
import { AssetProps, useAsset } from './useAsset'
import { Animator, Engine, Entity } from '../types'
import { FilamentAsset } from '../types/FilamentAsset'
import { useRenderableManager } from './useRenderableManager'
import { FilamentProxy } from '../native/FilamentProxy'
import { ISharedValue, useSharedValue } from 'react-native-worklets-core'

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

const context = FilamentProxy.getWorkletContext()

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
  const asset = useSharedValue<FilamentAsset | undefined>(undefined)

  useEffect(() => {
    Worklets.createRunInContextFn(() => {
      'worklet'
      if (assetBuffer == null) return

      if (!instanceCount || instanceCount === 1) {
        asset.value = engine.loadAsset(assetBuffer)
      } else {
        asset.value = engine.loadInstancedAsset(assetBuffer, instanceCount)
      }
    }, context)()
  }, [asset, assetBuffer, engine, instanceCount])

  const animator = useMemo(() => {
    if (asset.value == null) return undefined
    return asset.value.getAnimator()
  }, [asset.value])

  const entities = useMemo(() => {
    if (asset.value == null) return undefined
    return asset.value.getEntities()
  }, [asset.value])

  const renderableEntities = useMemo(() => {
    if (asset.value == null) return undefined
    return asset.value.getRenderableEntities()
  }, [asset.value])

  useEffect(() => {
    if (shouldReleaseSourceData) {
      // releases CPU memory for bindings
      asset.value?.releaseSourceData()
    }
  }, [asset.value, shouldReleaseSourceData])

  useEffect(() => {
    if (!autoAddToScene || asset.value == null) {
      return
    }
    Worklets.createRunInContextFn(() => {
      'worklet'

      if (asset.value == null) return
      console.log('added asset entities')
      engine.getScene().addAssetEntities(asset.value)
    }, context)()

    return () => {
      Worklets.createRunInContextFn(() => {
        'worklet'

        if (asset.value == null) return
        console.log('removed asset entities')
        engine.getScene().removeAssetEntities(asset.value)
      }, context)()
    }
  }, [autoAddToScene, engine, asset.value, entities])

  const prevCastShadowRef = useRef(castShadow)
  useEffect(() => {
    prevCastShadowRef.current = castShadow

    Worklets.createRunInContextFn(() => {
      'worklet'

      if (asset.value == null) return
      const root = asset.value.getRoot()
      if (castShadow || prevCastShadowRef.current !== castShadow) {
        renderableManager.setCastShadow(root, true)
      }
    }, context)()
  }, [castShadow, asset.value, entities, renderableManager])

  const prevReceiveShadowRef = useRef(receiveShadow)
  useEffect(() => {
    prevReceiveShadowRef.current = receiveShadow

    Worklets.createRunInContextFn(() => {
      'worklet'

      if (asset.value == null) return
      const root = asset.value.getRoot()
      if (receiveShadow || prevReceiveShadowRef.current !== receiveShadow) {
        renderableManager.setReceiveShadow(root, true)
      }
    }, context)()
  }, [receiveShadow, asset.value, renderableManager])

  if (assetBuffer == null || asset.value == null || animator == null || entities == null || renderableEntities == null) {
    return {
      state: 'loading',
    }
  }
  return {
    state: 'loaded',
    asset: asset.value,
    animator: animator,
    entities: entities,
    renderableEntities: renderableEntities,
  }
}
