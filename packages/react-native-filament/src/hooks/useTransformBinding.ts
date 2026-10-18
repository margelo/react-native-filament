import { useRenderCommit } from '../react/useRenderCommit'
import type { TransformBinding } from '../specs/control/TransformBinding.nitro'
import type { Entity } from '../specs/types/Entity'
import { useDisposableResource } from './useDisposableResource'

/**
 * A binding that owns the local transform of `entity` while the component is mounted. Its setters
 * work from any thread, such as a Reanimated worklet on the UI runtime.
 */
export function useTransformBinding(entity: Entity | undefined): TransformBinding | undefined {
  const commit = useRenderCommit()
  return useDisposableResource(() => {
    if (entity == null) return undefined
    const { engine } = commit
    return commit.run(() => {
      'worklet'
      return engine.createTransformBinding(entity)
    })
  }, [commit, entity])
}
