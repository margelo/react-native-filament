import React, { PropsWithChildren, useCallback, useContext, useEffect, useMemo } from 'react'
import { BufferSource } from '../hooks/useBuffer'
import { ModelProps as UseModelProps, useModel } from '../hooks/useModel'
import { ParentModelAssetContext } from './ParentModelAssetContext'
import { getAssetFromModel } from '../utilities/getAssetFromModel'
import { useFilamentContext } from './Context'
import { GestureResponderEvent } from 'react-native'
import { Logger } from '../utilities/logger/Logger'
import { Entity } from '../types'
import { TouchHandlerContext } from './TouchHandlerContext'
import { useApplyTransformations } from '../hooks/internal/useApplyTransformations'
import { extractTransformationProps, TransformationProps, TransformContext } from './TransformContext'
import { ParentInstancesContext } from './ParentInstancesContext'

type ModelProps = TransformationProps &
  UseModelProps & {
    source: BufferSource

    /**
     * Will be called when the user pressed any of the rendered entities of the model.
     */
    onPress?: (entity: Entity, modelEntities: Entity[]) => void
  }

/**
 * Loads a model from the given source.
 *
 *
 * If you are passing in a `.glb` model or similar from your app's bundle using `require(..)`, make sure to add `glb` as an asset extension to `metro.config.js`!
 * If you are passing in a `{ uri: ... }`, make sure the URL points directly to a `.glb` model. This can either be a web URL (`http://..`/`https://..`), a local file (`file://..`), or an native asset path (`path/to/asset.glb`)
 */
export function Model({ children, source, onPress, ...restProps }: PropsWithChildren<ModelProps>) {
  const [transformProps, modelProps] = extractTransformationProps(restProps)

  const model = useModel(source, modelProps)
  const asset = getAssetFromModel(model)

  const rootEntity = useMemo(() => {
    if (asset === undefined) {
      return null
    }
    return asset.getRoot()
  }, [asset])
  const boundingBox = model.state === 'loaded' ? model.boundingBox : undefined
  const mergedTransformations = useApplyTransformations({ transformProps: transformProps, to: rootEntity, aabb: boundingBox })

  const renderableEntities = useMemo(() => {
    // The entities are only needed for touch events, so only load them if a touch handler is provided
    if (asset == null || onPress == null) return []
    return asset.getRenderableEntities()
  }, [asset, onPress])

  const { view } = useFilamentContext()
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
          console.log('entity', entity.id, 'renderableEntity', renderableEntity.id)
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

  if (asset == null || rootEntity == null) {
    return null
  }
  return (
    <ParentModelAssetContext.Provider value={asset}>
      <ParentInstancesContext.Provider value={instances}>
        <TransformContext.Provider value={mergedTransformations}>{children}</TransformContext.Provider>
      </ParentInstancesContext.Provider>
    </ParentModelAssetContext.Provider>
  )
}
