import { useFilamentScene } from '../react/useFilamentScene'
import { useRenderCommit } from '../react/useRenderCommit'
import type { PhysicsWorld } from '../specs/physics/PhysicsWorld.nitro'
import type { PhysicsWorldOptions } from '../specs/types/PhysicsWorldOptions'
import { useDisposableResource } from '../hooks/useDisposableResource'

/**
 * A physics world that steps with the Engine's frames unless `autoStep` is false. It is recreated, with
 * all its bodies, when an option changes, and disposed with its bodies on unmount.
 */
export function useWorld(options: PhysicsWorldOptions = {}): PhysicsWorld | undefined {
  const { engine } = useFilamentScene()
  const commit = useRenderCommit()
  const key = JSON.stringify(options)
  return useDisposableResource(() => {
    const resolved = JSON.parse(key) as PhysicsWorldOptions
    return commit.run(() => {
      'worklet'
      return engine.createPhysicsWorld(resolved)
    })
  }, [engine, commit, key])
}
