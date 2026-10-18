import { useEffect } from 'react'
import { useRenderCommit } from '../react/useRenderCommit'
import { useReportFailure } from '../react/useReportFailure'
import type { Scene } from '../specs/scene/Scene.nitro'
import type { Entity } from '../specs/types/Entity'

/**
 * Adds `entity` to `scene` while the component is mounted. The scene does not keep the entity alive:
 * hold the `Light` or `Renderable` that owns it (for example with `useDisposableResource`) for as long
 * as the component is mounted.
 */
export function useEntityInScene(scene: Scene, entity: Entity | undefined): void {
  const commit = useRenderCommit()
  const fail = useReportFailure()
  useEffect(() => {
    if (entity == null) return
    commit
      .run(() => {
        'worklet'
        scene.addEntity(entity)
      })
      .catch(fail)
    return () => {
      commit.post(() => {
        'worklet'
        scene.removeEntity(entity)
      })
    }
  }, [scene, entity, commit, fail])
}
