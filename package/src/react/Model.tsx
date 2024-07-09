import React, { PropsWithChildren, useCallback, useEffect, useMemo } from 'react'
import { BufferSource } from '../hooks/useBuffer'
import { ModelProps as UseModelProps, useModel } from '../hooks/useModel'
import { ParentModelAssetContext } from './ParentModelAssetContext'
import { ParentEntityContext } from './ParentEntityContex'
import { getAssetFromModel } from '../utilities/getAssetFromModel'
import { useFilamentContext } from './Context'
import { GestureResponderEvent, StyleSheet, View } from 'react-native'
import { getLogger } from '../utilities/logger/Logger'
import { Entity } from '../types'
const Logger = getLogger()

type ModelProps = UseModelProps & {
  source: BufferSource

  /**
   * Transforms the given entity to fit into a unit cube (1,1,1) at the origin (0,0,0).
   * @param entity The entity to transform
   */
  transformToUnitCube?: boolean

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
export function Model({ children, source, transformToUnitCube, onPress, ...modelProps }: PropsWithChildren<ModelProps>) {
  const model = useModel(source, modelProps)
  const asset = getAssetFromModel(model)
  const rootEntity = useMemo(() => {
    if (asset === undefined) {
      return null
    }
    return asset.getRoot()
  }, [asset])

  const { transformManager } = useFilamentContext()
  useEffect(() => {
    if (asset == null) return

    if (transformToUnitCube) {
      transformManager.transformToUnitCube(asset)
    }
  }, [transformManager, asset, transformToUnitCube])

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
          onPress(entity, renderableEntities)
          return
        }
      }
      Logger.debug('No renderable entity of the model was picked')
    },
    [onPress, renderableEntities, view]
  )

  if (asset == null || rootEntity == null) {
    return null
  }
  return (
    <ParentModelAssetContext.Provider value={asset}>
      <ParentEntityContext.Provider value={rootEntity}>
        {onPress == null ? (
          children
        ) : (
          <View style={styles.flex1} onTouchStart={onTouchStart}>
            {children}
          </View>
        )}
      </ParentEntityContext.Provider>
    </ParentModelAssetContext.Provider>
  )
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
})
