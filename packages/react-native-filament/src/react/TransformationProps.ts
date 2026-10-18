import type { ListenableValue } from '../bindings/ListenableValue'
import type { Float3 } from '../specs/types/Float3'

/**
 * The local transform of an entity: `translate · rotate · scale`, applied after the unit-cube fit
 * and after the entity's own transform when it was first bound. Every value accepts a SharedValue.
 */
export interface TransformationProps {
  /** Position in meters. @default [0, 0, 0] */
  translate?: Float3 | ListenableValue<Float3>
  /** Radians around X, then Y, then Z. @default [0, 0, 0] */
  rotate?: Float3 | ListenableValue<Float3>
  /** @default [1, 1, 1] */
  scale?: Float3 | ListenableValue<Float3>
  /** Fits the bounding box into a cube from -1 to 1 around the origin first. @default false */
  transformToUnitCube?: boolean
}
