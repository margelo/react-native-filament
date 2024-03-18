import { RigidBody } from './RigidBody'

export interface DiscreteDynamicWorld {
  addRigidBody(rigidBody: RigidBody): void
  /**
   * Update the simulation each frame.
   * @param timeStep The time passed
   * @param maxSubSteps @default 1
   * @param fixedTimeStep @default 1/60 (60 Hz)
   */
  stepSimulation(timeStep: number, maxSubSteps: number, fixedTimeStep: number): void
}
