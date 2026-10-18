import { useEffect } from 'react'
import { assetKey } from '../assets/assetKey'
import { toAssetSource } from '../assets/toAssetSource'
import { useDisposableResource } from '../hooks/useDisposableResource'
import type { Entity } from '../specs/types/Entity'
import type { TextureMap } from './TextureMap'
import { useFilamentScene } from './useFilamentScene'
import { useRenderCommit } from './useRenderCommit'
import { useReportFailure } from './useReportFailure'

export function TextureModifier({ entity, materialName, textureSource, srgb }: TextureMap & { entity: Entity }) {
  const { engine, renderableManager } = useFilamentScene()
  const commit = useRenderCommit()
  const fail = useReportFailure()
  const key = assetKey(textureSource)
  const texture = useDisposableResource(() => engine.loadTexture(toAssetSource(textureSource), { srgb }), [engine, key, srgb])
  useEffect(() => {
    if (texture == null) return
    commit
      .run(() => {
        'worklet'
        const primitives = renderableManager.getPrimitiveCount(entity)
        for (let index = 0; index < primitives; index++) {
          const instance = renderableManager.getMaterialInstanceAt(entity, index)
          if (instance.instanceName === materialName) instance.setTexture('baseColorMap', texture, {})
        }
      })
      .catch(fail)
  }, [texture, entity, materialName, renderableManager, commit, fail])
  return null
}
