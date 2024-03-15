import { DiscreteDynamicWorld } from './DiscreteDynamicWorld'
import { RigidBody } from './RigidBody'
import { BaseShape, Box } from './Shapes'

export interface BulletAPI {
  createDiscreteDynamicWorld(gravityX: number, gravityY: number, gravityZ: number): DiscreteDynamicWorld
  createBoxShape(halfX: number, halfY: number, halfZ: number): Box
  createRigidBody(mass: number, x: number, y: number, z: number, shape: BaseShape): RigidBody
}
