import type { ListenableValue } from '../bindings/ListenableValue'
import type { Float3 } from '../specs/types/Float3'

interface LightConfigBase {
  /** Correlated color temperature in kelvin. @default 6500 */
  colorKelvin?: number | ListenableValue<number>
  /** Lux for directional and sun lights, lumens for point and spot lights. */
  intensity?: number | ListenableValue<number>
  castShadows?: boolean
}

export interface DirectionalLightConfig extends LightConfigBase {
  type: 'directional'
  /** Direction the light travels in. @default [0, -1, 0] */
  direction?: Float3 | ListenableValue<Float3>
}

export interface SunLightConfig extends LightConfigBase {
  type: 'sun'
  /** Direction the light travels in. @default [0, -1, 0] */
  direction?: Float3 | ListenableValue<Float3>
  /** Angular radius of the sun in degrees, which sizes its highlight on glossy surfaces. @default 0.545 */
  angularRadiusDegrees?: number
  /** Halo size of the sun disk, which the library's skyboxes do not draw. @default 10 */
  haloSize?: number
  /** Halo falloff of the sun disk, which the library's skyboxes do not draw. @default 80 */
  haloFalloff?: number
}

export interface PointLightConfig extends LightConfigBase {
  type: 'point'
  /** @default [0, 0, 0] */
  position?: Float3 | ListenableValue<Float3>
  /** Distance in meters at which the light stops having an effect. @default 1 */
  falloffRadius?: number
}

export interface SpotLightConfig extends LightConfigBase {
  /** A `spot` keeps its intensity when its cone changes; a physically correct `focused-spot` looks dimmer with a wider cone. */
  type: 'spot' | 'focused-spot'
  /** @default [0, 0, 0] */
  position?: Float3 | ListenableValue<Float3>
  /** Direction the light points in. @default [0, -1, 0] */
  direction?: Float3 | ListenableValue<Float3>
  /** Distance in meters at which the light stops having an effect. @default 1 */
  falloffRadius?: number
  /** `[inner, outer]` cone angles in radians. @default [π/8, π/4] */
  spotLightCone?: [number, number]
}

export type LightConfig = DirectionalLightConfig | SunLightConfig | PointLightConfig | SpotLightConfig
