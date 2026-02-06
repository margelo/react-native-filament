import React, { ReactNode, useCallback, useContext, useEffect, useMemo } from 'react'
import { BufferSource } from '../hooks/useBuffer'
import { FilamentModel, UseModelConfigParams, useModel } from '../hooks/useModel'
import { getAssetFromModel } from '../utilities/getAssetFromModel'
import { useFilamentContext } from '../hooks/useFilamentContext'
import { GestureResponderEvent } from 'react-native'
import { Logger } from '../utilities/logger/Logger'
import { Entity } from '../types'
import { TouchHandlerContext } from './TouchHandlerContext'
import { useApplyTransformations } from '../hooks/internal/useApplyTransformations'
import { extractTransformationProps, TransformationProps } from '../types/TransformProps'
import { ParentInstancesContext } from './ParentInstancesContext'
import { useConfigureAssetShadow } from '../hooks/useConfigureAssetShadow'

// Props we need for loading the model
export type LoadModelProps = UseModelConfigParams & {
  source: BufferSource
}
export type UIProps = TransformationProps & {
  /**
   * Will be called when the user pressed any of the rendered entities of the model.
   */
  onPress?: (entity: Entity, modelEntities: Entity[]) => void

  children?: ReactNode | undefined

  /**
   * @default false
   */
  castShadow?: boolean

  /**
   * @default false
   */
  receiveShadow?: boolean
}

export type ModelProps = LoadModelProps & UIProps
/**
 * Loads a model from the given source.
 *
 *
 * If you are passing in a `.glb` model or similar from your app's bundle using `require(..)`, make sure to add `glb` as an asset extension to `metro.config.js`!
 * If you are passing in a `{ uri: ... }`, make sure the URL points directly to a `.glb` model. This can either be a web URL (`http://..`/`https://..`), a local file (`file://..`), or an native asset path (`path/to/asset.glb`)
 */
export function Model({ source, ...restProps }: ModelProps) {
  const [_transformProps, modelProps] = extractTransformationProps(restProps)

  const model = useModel(source, modelProps)

  return <ModelRenderer model={model} {...restProps} />
}

export type ModelRendererProps = {
  /**
   * The model to render obtained by the `useModel` hook.
   */
  model: FilamentModel
} & UIProps

/**
 * Renders a model that was loaded with `useModel`.
 * Always prefer the `Model` component, except when you explicitly need to access the model instance imperatively.
 */
export function ModelRenderer({ model, onPress, children, ...restProps }: ModelRendererProps) {
  const [transformProps] = extractTransformationProps(restProps)
  const asset = getAssetFromModel(model)

  const boundingBox = model.state === 'loaded' ? model.boundingBox : undefined
  const rootEntity = model.state === 'loaded' ? model.rootEntity : undefined
  useApplyTransformations({ transformProps: transformProps, to: rootEntity, aabb: boundingBox })

  const renderableEntities = useMemo(() => {
    // The entities are only needed for touch events, so only load them if a touch handler is provided
    if (asset == null || onPress == null) return []
    return asset.getRenderableEntities()
  }, [asset, onPress])

  const { view, renderableManager } = useFilamentContext()
  const onTouchStart = useCallback(
    async (event: GestureResponderEvent) => {
      if (renderableEntities == null || onPress == null) return

      const { locationX, locationY } = event.nativeEvent
      const entity = await view.pickEntity(locationX, locationY)
      Logger.debug('Picked entity', entity, 'at', locationX, locationY)
      if (entity == null) {
        Logger.debug('No entity was picked')
        return
      }

      // Check if the model was picked
      for (const renderableEntity of renderableEntities) {
        if (entity?.id === renderableEntity.id) {
          Logger.debug('entity', entity.id, 'renderableEntity', renderableEntity.id)
          onPress(entity, renderableEntities)
          return
        }
      }
      Logger.debug('No renderable entity of the model was picked:', renderableEntities)
    },
    [onPress, renderableEntities, view]
  )

  const { addTouchHandler } = useContext(TouchHandlerContext)
  useEffect(() => {
    if (onPress == null) return

    const id = Math.random().toString(36).substring(7)
    Logger.debug('Adding touch handler', id)
    const removeHandler = addTouchHandler(onTouchStart)

    return () => {
      Logger.debug('Removing touch handler', id)
      removeHandler()
    }
  }, [addTouchHandler, onPress, onTouchStart])

  const instances = useMemo(() => {
    if (asset === undefined) {
      return null
    }
    return asset.getAssetInstances()
  }, [asset])

  useConfigureAssetShadow({
    renderableManager,
    asset,
    castShadow: restProps.castShadow,
    receiveShadow: restProps.receiveShadow,
  })

  if (asset == null) {
    return null
  }
  return <ParentInstancesContext.Provider value={instances}>{children}</ParentInstancesContext.Provider>
}
