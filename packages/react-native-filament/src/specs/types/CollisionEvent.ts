import type { RigidBody } from '../physics/RigidBody.nitro'
import type { CollisionEventKind } from './CollisionEventKind'

export interface CollisionEvent {
  kind: CollisionEventKind
  bodyA: RigidBody
  bodyB: RigidBody
}
