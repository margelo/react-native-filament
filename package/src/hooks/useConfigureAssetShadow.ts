import { useEffect, useMemo, useRef } from 'react'
import { FilamentAsset, RenderableManager } from '../types'
import { useFilamentContext } from '../FilamentContext'

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
  const { _workletContext } = useFilamentContext()

  const renderableEntities = useMemo(() => asset?.getRenderableEntities(), [asset])
  const prevCastShadowRef = useRef<boolean>()
  useEffect(() => {
    if (renderableEntities == null || castShadow == null || prevCastShadowRef.current === castShadow) {
      return
    }
    prevCastShadowRef.current = castShadow

    _workletContext.runAsync(() => {
      'worklet'

      renderableEntities.forEach((entity) => {
        renderableManager.setCastShadow(entity, castShadow)
      })
    })
  }, [castShadow, renderableManager, renderableEntities, _workletContext])

  const prevReceiveShadowRef = useRef<boolean>()
  useEffect(() => {
    if (renderableEntities == null || receiveShadow == null || prevReceiveShadowRef.current === receiveShadow) {
      return
    }
    prevReceiveShadowRef.current = receiveShadow

    _workletContext.runAsync(() => {
      'worklet'

      renderableEntities.forEach((entity) => {
        renderableManager.setReceiveShadow(entity, receiveShadow)
      })
    })
  }, [receiveShadow, renderableEntities, renderableManager, _workletContext])
}
