import type { Float3 } from './Float3'

export interface PointLightOptions {
  /** Correlated color temperature in kelvin. @default 6500 */
  colorKelvin?: number
  /** Luminous power in lumens. @default 1000 */
  intensityLumens?: number
  /** @default [0, 0, 0] */
  position?: Float3
  /** Distance in meters at which the light stops having an effect. @default 1 */
  falloffRadius?: number
  /** @default false */
  castShadows?: boolean
}
