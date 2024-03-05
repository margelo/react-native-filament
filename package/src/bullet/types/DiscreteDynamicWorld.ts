import { RigidBody } from './RigidBody'

export interface DiscreteDynamicWorld {
  addRigidBody(rigidBody: RigidBody): void
  stepSimulation(timeStep: number, maxSubSteps: number, fixedTimeStep: number): void
}
