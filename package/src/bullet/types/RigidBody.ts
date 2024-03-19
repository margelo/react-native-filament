export type ActivationState = 'active_state' | 'island_sleeping' | 'want_deactivation' | 'disable_deactivation' | 'disable_simulation'

export type CollisionCallback = (id: string) => void

export interface RigidBody {
  setDamping(linearDamping: number, angularDamping: number): void
  friction: number
  activationState: ActivationState
  id: string
  setCollisionCallback(callback?: CollisionCallback): void
}
