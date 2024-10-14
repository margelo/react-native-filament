import { HybridObject } from 'react-native-nitro-modules'
import { Float3, Float4, Mat3f } from './Math'

export type CullingMode = 'none' | 'back' | 'front' | 'frontAndBack'

export type TransparencyMode = 'default' | 'twoPassesOneSide' | 'twoPassesTwoSides'

export interface MaterialInstance extends HybridObject<{ android: 'c++', ios: 'c++' }> {
  setCullingMode(mode: CullingMode): void
  setTransparencyMode(mode: TransparencyMode): void
  changeAlpha(alpha: number): void
  setFloatParameter(name: string, value: number): void
  setIntParameter(name: string, value: number): void
  setMat3fParameter(name: string, value: Mat3f): void
  setFloat3Parameter(name: string, vector: Float3): void
  setFloat4Parameter(name: string, vector: Float4): void
  getFloatParameter(name: string): number
  getIntParameter(name: string): number
  getMat3fParameter(name: string): Mat3f
  getFloat3Parameter(name: string): Float3
  getFloat4Parameter(name: string): Float4
  readonly name: string
}
