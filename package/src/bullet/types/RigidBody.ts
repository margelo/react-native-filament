export interface RigidBody {
  setDamping(linearDamping: number, angularDamping: number): void
  friction: number
}
