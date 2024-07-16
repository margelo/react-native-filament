import { Mat4 } from '../../types/TransformManager'
import { DiscreteDynamicWorld } from './DiscreteDynamicWorld'
import { CollisionCallback, RigidBody } from './RigidBody'
import { BaseShape, BoxShape, CylinderShape, SphereShape, StaticPlaneShape } from './Shapes'

export interface BulletAPI {
  createDiscreteDynamicWorld(gravityX: number, gravityY: number, gravityZ: number): DiscreteDynamicWorld
  createBoxShape(halfX: number, halfY: number, halfZ: number): BoxShape
  /**
   * Implements a cylinder shape primitive, centered around the origin. Its central axis aligned with the Y axis.
   * cylinderShapeX is aligned with the X axis and cylinderShapeZ around the Z axis.
   *
   * Cylinder is defined as following:
   *
   * - principle axis aligned along y by default, radius in x, z-value not used
   * - for cylinderShapeX: principle axis aligned along x, radius in y direction, z-value not used
   * - for cylinderShapeZ: principle axis aligned along z, radius in x direction, y-value not used
   *
   *
   * @param halfX
   * @param halfY
   * @param halfZ
   */
  createCylinderShape(halfX: number, halfY: number, halfZ: number): CylinderShape
  createCylinderShapeX(halfX: number, halfY: number, halfZ: number): CylinderShape
  createCylinderShapeZ(halfX: number, halfY: number, halfZ: number): CylinderShape
  createStaticPlaneShape(normalX: number, normalY: number, normalZ: number, constant: number): StaticPlaneShape
  createSphereShape(radius: number): SphereShape
  createRigidBody(
    mass: number,
    x: number,
    y: number,
    z: number,
    shape: BaseShape,
    id: string,
    collisionCallback: CollisionCallback | undefined
  ): RigidBody
  createRigidBodyFromTransform(
    mass: number,
    transform: Mat4,
    shape: BaseShape,
    id: string,
    collisionCallback: CollisionCallback | undefined
  ): RigidBody
}
