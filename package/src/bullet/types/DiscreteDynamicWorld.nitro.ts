import { HybridObject } from 'react-native-nitro-modules'
import { RigidBody } from './RigidBody.nitro'

export interface DiscreteDynamicWorld extends HybridObject<{ android: 'c++', ios: 'c++' }> {
  addRigidBody(rigidBody: RigidBody): void
  removeRigidBody(rigidBody: RigidBody): void
  /**
   * Update the simulation each frame.
   * @param timeStep The time passed
   * @param maxSubSteps @default 1
   * @param fixedTimeStep @default 1/60 (60 Hz)
   */
  stepSimulation(timeStep: number, maxSubSteps: number, fixedTimeStep: number): void
}
