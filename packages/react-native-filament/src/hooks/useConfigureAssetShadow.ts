import { useEffect } from 'react'
import { useFilamentScene } from '../react/useFilamentScene'
import { useRenderCommit } from '../react/useRenderCommit'
import { useReportFailure } from '../react/useReportFailure'
import type { Entity } from '../specs/types/Entity'

export interface AssetShadowOptions {
  /** Entities to configure; those without a renderable component are skipped. */
  entities: Entity[] | undefined
  /** Leaves the setting untouched when omitted. */
  castShadow?: boolean
  /** Leaves the setting untouched when omitted. */
  receiveShadow?: boolean
}

/** Sets whether the renderables among `entities` cast and receive shadows. */
export function useConfigureAssetShadow({ entities, castShadow, receiveShadow }: AssetShadowOptions): void {
  const { renderableManager } = useFilamentScene()
  const commit = useRenderCommit()
  const fail = useReportFailure()
  useEffect(() => {
    if (entities == null || (castShadow == null && receiveShadow == null)) return
    commit
      .run(() => {
        'worklet'
        for (const entity of entities) {
          if (!renderableManager.hasComponent(entity)) continue
          if (castShadow != null) renderableManager.setCastShadows(entity, castShadow)
          if (receiveShadow != null) renderableManager.setReceiveShadows(entity, receiveShadow)
        }
      })
      .catch(fail)
  }, [entities, castShadow, receiveShadow, renderableManager, commit, fail])
}
