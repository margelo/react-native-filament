import type { CollisionShape } from '../specs/physics/CollisionShape.nitro'
import type { PhysicsWorld } from '../specs/physics/PhysicsWorld.nitro'
import { useCollisionShape } from './useCollisionShape'

/** A sphere shape in `world` with a radius in meters, created once `world` exists, recreated when the radius changes and disposed on unmount. */
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
