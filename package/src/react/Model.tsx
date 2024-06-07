import React, { PropsWithChildren, useEffect, useMemo } from 'react'
import { BufferSource } from '../hooks/useBuffer'
import { ModelProps as UseModelProps, useModel } from '../hooks/useModel'
import { ParentModelAssetContext } from './ParentModelAssetContex'
import { ParentEntityContext } from './ParentEntityContex'
import { getAssetFromModel } from '../utilities/getAssetFromModel'
import { useFilamentContext } from './Context'

type ModelProps = UseModelProps & {
  source: BufferSource

  /**
   * Transforms the given entity to fit into a unit cube (1,1,1) at the origin (0,0,0).
   * @param entity The entity to transform
   */
  transformToUnitCube?: boolean
}

/**
 * Loads a model from the given source.
 *
 *
 * If you are passing in a `.glb` model or similar from your app's bundle using `require(..)`, make sure to add `glb` as an asset extension to `metro.config.js`!
 * If you are passing in a `{ url: ... }`, make sure the URL points directly to a `.glb` model. This can either be a web URL (`http://..`/`https://..`), a local file (`file://..`), or an native asset path (`path/to/asset.glb`)
 */
export function Model({ children, source, transformToUnitCube, ...modelProps }: PropsWithChildren<ModelProps>) {
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

  if (asset == null || rootEntity == null) {
    return null
  }
  return (
    <ParentModelAssetContext.Provider value={asset}>
      <ParentEntityContext.Provider value={rootEntity}>{children}</ParentEntityContext.Provider>
    </ParentModelAssetContext.Provider>
  )
}
