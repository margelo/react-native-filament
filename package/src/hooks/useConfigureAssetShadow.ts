import { useEffect, useMemo, useRef } from 'react'
import { FilamentAsset, RenderableManager } from '../types'
import { useFilamentContext } from './useFilamentContext'
import { BoxedHybridObject } from 'react-native-nitro-modules/lib/BoxedHybridObject'

export type UseAssetShadowProps = {
  renderableManager: BoxedHybridObject<RenderableManager>
  asset?: BoxedHybridObject<FilamentAsset>
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
  const { workletContext } = useFilamentContext()

  const renderableEntities = useMemo(() => (asset == null ? undefined : asset.unbox().getRenderableEntities()), [asset])
  const prevCastShadowRef = useRef<boolean>()
  useEffect(() => {
    if (renderableEntities == null || castShadow == null || prevCastShadowRef.current === castShadow) {
      return
    }
    prevCastShadowRef.current = castShadow

    workletContext.runAsync(() => {
      'worklet'

      const unboxedRenderableManager = renderableManager.unbox()
      renderableEntities.forEach((entity) => {
        unboxedRenderableManager.setCastShadow(entity, castShadow)
      })
    })
  }, [castShadow, renderableManager, renderableEntities, workletContext])

  const prevReceiveShadowRef = useRef<boolean>()
  useEffect(() => {
    if (renderableEntities == null || receiveShadow == null || prevReceiveShadowRef.current === receiveShadow) {
      return
    }
    prevReceiveShadowRef.current = receiveShadow

    workletContext.runAsync(() => {
      'worklet'

      const unboxedRenderableManager = renderableManager.unbox()
      renderableEntities.forEach((entity) => {
        unboxedRenderableManager.setReceiveShadow(entity, receiveShadow)
      })
    })
  }, [receiveShadow, renderableEntities, renderableManager, workletContext])
}
