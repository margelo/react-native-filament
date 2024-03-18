import { Float3 } from '../../types'

export interface BaseShape {
  localScaling: Float3
  margin: number
}

export interface Box extends BaseShape {}

export interface Cylinder extends BaseShape {}

export interface StaticPlaneShape extends BaseShape {}
