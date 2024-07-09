import React from 'react'
import { Float3 } from '../types'

export type Transformations = {
  position?: Float3
  scale?: Float3
  rotate?: Float3
  multiplyWithCurrentTransform?: boolean
  transformToUnitCube?: boolean
}

export const TransformContext = React.createContext<Transformations | undefined>(undefined)
