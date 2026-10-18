import type { CollisionShape } from '../specs/physics/CollisionShape.nitro'
import type { PhysicsWorld } from '../specs/physics/PhysicsWorld.nitro'
import type { Float3 } from '../specs/types/Float3'
import { useCollisionShape } from './useCollisionShape'

/** A static plane `dot(normalize(normal), point) = constant` in `world`, for static bodies only, created once `world` exists, recreated when an argument changes and disposed on unmount. */
export function useStaticPlaneShape(world: PhysicsWorld | undefined, normal: Float3, constant: number): CollisionShape | undefined {
  const [x, y, z] = normal
  return useCollisionShape(
    world,
    (target) => {
      'worklet'
      return target.createStaticPlaneShape([x, y, z], constant)
    },
    [x, y, z, constant]
  )
}
