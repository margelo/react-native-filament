import { HybridObject } from 'react-native-nitro-modules'
import { Float3 } from '../../types'

export interface BaseShape extends HybridObject<{ android: 'c++', ios: 'c++' }> {
  localScaling: Float3
  margin: number
}

export interface BoxShape extends BaseShape {}

export interface CylinderShape extends BaseShape {}

export interface StaticPlaneShape extends BaseShape {}

export interface SphereShape extends BaseShape {}
