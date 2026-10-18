import type { Float3 } from './Float3'

export interface SunLightOptions {
  /** Correlated color temperature in kelvin. @default 6500 */
  colorKelvin?: number
  /** Illuminance in lux. @default 100000 */
  intensityLux?: number
  /** Direction the light travels in. @default [0, -1, 0] */
  direction?: Float3
  /** @default true */
  castShadows?: boolean
  /** Angular radius of the sun in degrees, which sizes its highlight on glossy surfaces. @default 0.545 */
  angularRadiusDegrees?: number
  /** Halo size of the sun disk, which the library's skyboxes do not draw. @default 10 */
  haloSize?: number
  /** Halo falloff of the sun disk, which the library's skyboxes do not draw. @default 80 */
  haloFalloff?: number
}
