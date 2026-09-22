import { useEffect, useMemo, useRef } from 'react'
import { scheduleOnRuntime } from 'react-native-worklets'
import { FilamentAsset, RenderableManager } from '../types'
import { useFilamentContext } from './useFilamentContext'

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
  const { workletRuntime } = useFilamentContext()

  const renderableEntities = useMemo(() => asset?.getRenderableEntities(), [asset])
  const prevCastShadowRef = useRef<boolean | null>(null)
  useEffect(() => {
    if (renderableEntities == null || castShadow == null || prevCastShadowRef.current === castShadow) {
      return
    }
    prevCastShadowRef.current = castShadow

    scheduleOnRuntime(workletRuntime, () => {
      'worklet'

      renderableEntities.forEach((entity) => {
        renderableManager.setCastShadow(entity, castShadow)
      })
    })
  }, [castShadow, renderableManager, renderableEntities, workletRuntime])

  const prevReceiveShadowRef = useRef<boolean | null>(null)
  useEffect(() => {
    if (renderableEntities == null || receiveShadow == null || prevReceiveShadowRef.current === receiveShadow) {
      return
    }
    prevReceiveShadowRef.current = receiveShadow

    scheduleOnRuntime(workletRuntime, () => {
      'worklet'

      renderableEntities.forEach((entity) => {
        renderableManager.setReceiveShadow(entity, receiveShadow)
      })
    })
  }, [receiveShadow, renderableEntities, renderableManager, workletRuntime])
}
