import React from 'react'
import { Float3 } from '../types'

export type TransformationProps = {
  position?: Float3
  scale?: Float3
  rotate?: {
    angleInRadians: number
    axis: Float3
  }
  multiplyWithCurrentTransform?: boolean

  /**
   * Transforms the given entity to fit into a unit cube (1,1,1) at the origin (0,0,0).
   */
  transformToUnitCube?: boolean
}

export function extractTransformationProps<T extends TransformationProps>(
  props: T
): [TransformationProps, Omit<T, keyof TransformationProps>] {
  const { position, scale, rotate, multiplyWithCurrentTransform, transformToUnitCube, ...rest } = props
  return [
    {
      position,
      scale,
      rotate,
      multiplyWithCurrentTransform,
      transformToUnitCube,
    },
    rest,
  ]
}

export const TransformContext = React.createContext<TransformationProps | undefined>(undefined)
