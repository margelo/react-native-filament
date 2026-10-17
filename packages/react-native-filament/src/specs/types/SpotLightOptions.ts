import type { Float3 } from './Float3'

export interface SpotLightOptions {
  /** Correlated color temperature in kelvin. @default 6500 */
  colorKelvin?: number
  /** Luminous power in lumens. @default 1000 */
  intensityLumens?: number
  /** @default [0, 0, 0] */
  position?: Float3
  /** Direction the light points in. @default [0, -1, 0] */
  direction?: Float3
  /** Distance in meters at which the light stops having an effect. @default 1 */
  falloffRadius?: number
  /** Angle in radians from the axis where the light starts to fade. @default π/8 */
  innerConeRadians?: number
  /** Angle in radians from the axis where the light ends. @default π/4 */
  outerConeRadians?: number
  /** @default false */
  castShadows?: boolean
}
