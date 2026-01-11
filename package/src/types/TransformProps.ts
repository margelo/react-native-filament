import { Float3 } from '.'
import { type SharedValue } from 'react-native-reanimated'

// TODO: WithAnimatedProps ?

/**
 * Transformations are applied in the order of scale -> rotate -> translate.
 */
export type TransformationProps = {
  /**
   * Position in meters. Unit is in meters.
   * @default [0, 0, 0]
   */
  translate?: Float3 | SharedValue<Float3>

  /**
   * Scale for each axis. Unit is in meters.
   */
  scale?: Float3 | SharedValue<Float3>

  /**
   * Rotation for each axis in radians.
   */
  rotate?: Float3 | SharedValue<Float3>

  /**
   * If true, the current transformation of the entity will be multiplied with the new transformation.
   * @default true
   */
  multiplyWithCurrentTransform?: boolean

  /**
   * Transforms the given entity to fit into a unit cube (1,1,1) at the origin (0,0,0).
   */
  transformToUnitCube?: boolean
}

export function extractTransformationProps<T extends TransformationProps>(
  props: T
): [TransformationProps, Omit<T, keyof TransformationProps>] {
  const { translate, scale, rotate, multiplyWithCurrentTransform, transformToUnitCube, ...rest } = props
  return [
    {
      translate,
      scale,
      rotate,
      multiplyWithCurrentTransform,
      transformToUnitCube,
    },
    rest,
  ]
}
