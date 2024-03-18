import { Mat4f } from '../../types/TransformManager'
import { DiscreteDynamicWorld } from './DiscreteDynamicWorld'
import { RigidBody } from './RigidBody'
import { BaseShape, Box } from './Shapes'

export interface BulletAPI {
  createDiscreteDynamicWorld(gravityX: number, gravityY: number, gravityZ: number): DiscreteDynamicWorld
  createBoxShape(halfX: number, halfY: number, halfZ: number): Box
  /**
   * Implements a cylinder shape primitive, centered around the origin. Its central axis aligned with the Y axis.
   * cylinderShapeX is aligned with the X axis and cylinderShapeZ around the Z axis.
   * @param halfX
   * @param halfY
   * @param halfZ
   */
  createCylinderShape(halfX: number, halfY: number, halfZ: number): BaseShape
  createCylinderShapeX(halfX: number, halfY: number, halfZ: number): BaseShape
  createCylinderShapeZ(halfX: number, halfY: number, halfZ: number): BaseShape
  createRigidBody(mass: number, x: number, y: number, z: number, shape: BaseShape): RigidBody
  createRigidBodyFromTransform(mass: number, transform: Mat4f, shape: BaseShape): RigidBody
}
