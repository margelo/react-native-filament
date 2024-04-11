import { useEffect, useMemo, useRef } from 'react'
import { FilamentAsset, RenderableManager } from '../types'
import { FilamentProxy } from '../native/FilamentProxy'

export type UseAssetShadowProps = {
  renderableManager: RenderableManager
  asset?: FilamentAsset
  /**
   * @default false
   */
  receiveShadow?: boolean

  /**
   * @default false
   */
  castShadow?: boolean
}

export function useConfigureAssetShadow({ renderableManager, asset, receiveShadow, castShadow }: UseAssetShadowProps) {
  const context = useMemo(() => FilamentProxy.getWorkletContext(), [])

  const renderableEntities = useMemo(() => asset?.getRenderableEntities(), [asset])
  const prevCastShadowRef = useRef<boolean>()
  useEffect(() => {
    if (renderableEntities == null || castShadow == null || prevCastShadowRef.current === castShadow) {
      return
    }
    prevCastShadowRef.current = castShadow

    Worklets.createRunInContextFn(() => {
      'worklet'

      renderableEntities.forEach((entity) => {
        renderableManager.setCastShadow(entity, castShadow)
      })
    }, context)()
  }, [castShadow, renderableManager, renderableEntities, context])

  const prevReceiveShadowRef = useRef<boolean>()
  useEffect(() => {
    if (renderableEntities == null || receiveShadow == null || prevReceiveShadowRef.current === receiveShadow) {
      return
    }
    prevReceiveShadowRef.current = receiveShadow

    Worklets.createRunInContextFn(() => {
      'worklet'

      renderableEntities.forEach((entity) => {
        renderableManager.setReceiveShadow(entity, receiveShadow)
      })
    }, context)()
  }, [receiveShadow, renderableEntities, renderableManager, context])
}
