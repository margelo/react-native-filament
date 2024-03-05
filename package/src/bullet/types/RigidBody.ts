export type ActivationState = 'active_state' | 'island_sleeping' | 'want_deactivation' | 'disable_deactivation' | 'disable_simulation'

export interface RigidBody {
  setDamping(linearDamping: number, angularDamping: number): void
  friction: number
  activationState: ActivationState
}
