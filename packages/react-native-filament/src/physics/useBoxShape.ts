import type { CollisionShape } from '../specs/physics/CollisionShape.nitro'
import type { PhysicsWorld } from '../specs/physics/PhysicsWorld.nitro'
import type { Float3 } from '../specs/types/Float3'
import { useCollisionShape } from './useCollisionShape'

/** A box shape in `world` with half extents in meters, created once `world` exists, recreated when an extent changes and disposed on unmount. */
export function useBoxShape(world: PhysicsWorld | undefined, halfExtent: Float3): CollisionShape | undefined {
  const [x, y, z] = halfExtent
  return useCollisionShape(
    world,
    (target) => {
      'worklet'
      return target.createBoxShape([x, y, z])
    },
    [x, y, z]
  )
}
