import type { HybridObject, Sync } from 'react-native-nitro-modules'
import type { CollisionEvent } from '../types/CollisionEvent'
import type { CylinderAxis } from '../types/CylinderAxis'
import type { Float3 } from '../types/Float3'
import type { ListenerSubscription } from '../types/ListenerSubscription'
import type { RigidBodyOptions } from '../types/RigidBodyOptions'
import type { CollisionShape } from './CollisionShape.nitro'
import type { RigidBody } from './RigidBody.nitro'

/**
 * A Bullet dynamics world. Every member runs on the render thread. The world and its bodies keep each
 * other alive until you call `dispose()` or the Engine shuts down. Disposing it disposes its bodies and
 * shapes.
 */
export interface PhysicsWorld extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  gravity: Float3
  readonly bodyCount: number
  createBoxShape(halfExtent: Float3): CollisionShape
  createSphereShape(radius: number): CollisionShape
  createCylinderShape(halfExtent: Float3, axis: CylinderAxis): CollisionShape
  /** The plane `dot(normalize(normal), point) = constant`; only static bodies may use it. */
  createStaticPlaneShape(normal: Float3, constant: number): CollisionShape
  createRigidBody(options: RigidBodyOptions): RigidBody
  /** Advances the simulation by `deltaSeconds` in fixed steps, then syncs bound entities. */
  step(deltaSeconds: number): void
  /**
   * Called on the render thread after each step with the contacts that began or ended in it, only
   * when there are any. Returning `false` removes the listener.
   */
  addOnCollisionListener(listener: Sync<(events: CollisionEvent[]) => boolean>): ListenerSubscription
}
