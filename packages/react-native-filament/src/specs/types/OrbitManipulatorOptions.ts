import type { Float3 } from './Float3'

export interface OrbitManipulatorOptions {
  /** Camera position at start and after `jumpToHome()`. @default [0, 0, 4] */
  homePosition?: Float3
  /** Point the camera orbits around. @default [0, 0, 0] */
  targetPosition?: Float3
  /** @default [0, 1, 0] */
  upVector?: Float3
  /** Radians of orbit per point dragged. @default 0.005 */
  orbitSpeed?: number
  /** Distance change per unit of scroll delta, relative to the distance to the target. @default 0.01 */
  zoomSpeed?: number
}
