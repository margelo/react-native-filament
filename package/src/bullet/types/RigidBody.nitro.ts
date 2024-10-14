import { HybridObject } from "react-native-nitro-modules"

export type ActivationState = 'active_state' | 'island_sleeping' | 'want_deactivation' | 'disable_deactivation' | 'disable_simulation'

export type CollisionCallback = (thisBody: RigidBody, collidedWith: RigidBody) => void

export interface RigidBody extends HybridObject<{ android: 'c++', ios: 'c++' }> {
  setDamping(linearDamping: number, angularDamping: number): void
  friction: number
  activationState: ActivationState
  id: string
  setCollisionCallback(callback?: CollisionCallback): void
}
