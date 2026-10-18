import type { CollisionShape } from '../specs/physics/CollisionShape.nitro'
import type { PhysicsWorld } from '../specs/physics/PhysicsWorld.nitro'
import type { CylinderAxis } from '../specs/types/CylinderAxis'
import type { Float3 } from '../specs/types/Float3'
import { useCollisionShape } from './useCollisionShape'

export function useCylinderShape(
  world: PhysicsWorld | undefined,
  halfExtent: Float3,
  axis: CylinderAxis = 'y'
): CollisionShape | undefined {
  const [x, y, z] = halfExtent
  return useCollisionShape(
    world,
    (target) => {
      'worklet'
      return target.createCylinderShape([x, y, z], axis)
    },
    [x, y, z, axis]
  )
}
