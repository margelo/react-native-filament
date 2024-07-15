import React from 'react'
import { Float3 } from '../types'
import { ISharedValue } from 'react-native-worklets-core'

// TODO: WithAnimatedProps ?

/**
 * Transformations are applied in the order of scale -> rotate -> translate.
 */
export type TransformationProps = {
  /**
   * Position in meters. Unit is in meters.
   * @default [0, 0, 0]
   */
  translate?: Float3 | ISharedValue<Float3>

  /**
   * Scale for each axis. Unit is in meters.
   */
  scale?: Float3 | ISharedValue<Float3>

  /**
   * Rotation for each axis in radians.
   */
  rotate?: Float3 | ISharedValue<Float3>

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

export const TransformContext = React.createContext<TransformationProps | undefined>(undefined)
