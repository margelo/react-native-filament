import type { Float3 } from './Float3'

export interface PhysicsWorldOptions {
  /** Meters per second squared. @default [0, -9.81, 0] */
  gravity?: Float3
  /** Length of one simulation step. @default 1 / 60 */
  fixedTimeStepSeconds?: number
  /** Most fixed steps taken per frame; time beyond them is dropped. @default 4 */
  maxSubSteps?: number
  /**
   * Steps the world natively once per rendered frame by the frame's `deltaSeconds`, after frame
   * listeners and before targets render. Turn it off to call `step()` yourself. @default true
   */
  autoStep?: boolean
}
