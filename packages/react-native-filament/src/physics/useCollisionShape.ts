import type { DependencyList } from 'react'
import { useDisposableResource } from '../hooks/useDisposableResource'
import { useRenderCommit } from '../react/useRenderCommit'
import type { CollisionShape } from '../specs/physics/CollisionShape.nitro'
import type { PhysicsWorld } from '../specs/physics/PhysicsWorld.nitro'

export function useCollisionShape(
  world: PhysicsWorld | undefined,
  create: (world: PhysicsWorld) => CollisionShape,
  deps: DependencyList
): CollisionShape | undefined {
  const commit = useRenderCommit()
  return useDisposableResource(() => {
    if (world == null) return undefined
    return commit.run(() => {
      'worklet'
      return create(world)
    })
  }, [commit, world, ...deps])
}
