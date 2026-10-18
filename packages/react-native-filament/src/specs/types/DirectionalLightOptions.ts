import type { Float3 } from './Float3'

export interface DirectionalLightOptions {
  /** Correlated color temperature in kelvin. @default 6500 */
  colorKelvin?: number
  /** Illuminance in lux. @default 10000 */
  intensityLux?: number
  /** Direction the light travels in. @default [0, -1, 0] */
  direction?: Float3
  /** @default true */
  castShadows?: boolean
}
