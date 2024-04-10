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

  const assetRoot = useMemo(() => asset?.getRoot(), [asset])
  const prevCastShadowRef = useRef(castShadow)
  useEffect(() => {
    prevCastShadowRef.current = castShadow
    if (assetRoot == null || castShadow == null || prevCastShadowRef.current === castShadow) {
      return
    }

    Worklets.createRunInContextFn(() => {
      'worklet'

      renderableManager.setCastShadow(assetRoot, true)
    }, context)()
  }, [castShadow, renderableManager, assetRoot, context])

  const prevReceiveShadowRef = useRef(receiveShadow)
  useEffect(() => {
    prevReceiveShadowRef.current = receiveShadow
    if (assetRoot == null || receiveShadow == null || prevReceiveShadowRef.current === receiveShadow) {
      return
    }

    Worklets.createRunInContextFn(() => {
      'worklet'

      renderableManager.setReceiveShadow(assetRoot, receiveShadow)
    }, context)()
  }, [receiveShadow, assetRoot, renderableManager, context])
}
