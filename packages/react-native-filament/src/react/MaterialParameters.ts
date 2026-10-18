import type { ListenableValue } from '../bindings/ListenableValue'
import type { Float3 } from '../specs/types/Float3'
import type { Float4 } from '../specs/types/Float4'

/** glTF PBR parameters of one material; each accepts a SharedValue. */
export interface MaterialParameterValues {
  /** Linear RGBA. */
  baseColorFactor?: Float4 | ListenableValue<Float4>
  /** Linear RGB. */
  emissiveFactor?: Float3 | ListenableValue<Float3>
  roughnessFactor?: number | ListenableValue<number>
  metallicFactor?: number | ListenableValue<number>
  reflectance?: number | ListenableValue<number>
  clearCoatFactor?: number | ListenableValue<number>
  clearCoatRoughnessFactor?: number | ListenableValue<number>
}

export interface MaterialParametersItem {
  /** Primitive of the entity whose material instance to change. @default 0 */
  index?: number
  parameters: MaterialParameterValues
}

export type MaterialParameters = MaterialParametersItem | MaterialParametersItem[]
