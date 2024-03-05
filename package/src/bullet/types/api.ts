import { DiscreteDynamicWorld } from './DiscreteDynamicWorld'
import { RigidBody } from './RigidBody'

export interface BulletAPI {
  createDiscreteDynamicWorld(gravityX: number, gravityY: number, gravityZ: number): DiscreteDynamicWorld
  // Creates a box shape
  createRigidBody(mass: number, x: number, y: number, z: number, shapeX: number, shapeY: number, shapeZ: number): RigidBody
}
