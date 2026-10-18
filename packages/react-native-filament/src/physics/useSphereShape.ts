import type { CollisionShape } from '../specs/physics/CollisionShape.nitro'
import type { PhysicsWorld } from '../specs/physics/PhysicsWorld.nitro'
import { useCollisionShape } from './useCollisionShape'

export function useSphereShape(world: PhysicsWorld | undefined, radius: number): CollisionShape | undefined {
  return useCollisionShape(
    world,
    (target) => {
      'worklet'
      return target.createSphereShape(radius)
    },
    [radius]
  )
}
