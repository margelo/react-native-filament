import { RGBA } from './Color'
import { Float3, Mat3f } from './Math'

export type CullingMode = 'none' | 'back' | 'front' | 'frontAndBack'

export type TransparencyMode = 'default' | 'twoPassesOneSide' | 'twoPassesTwoSides'

export interface MaterialInstance {
  setCullingMode(mode: CullingMode): void
  setTransparencyMode(mode: TransparencyMode): void
  changeAlpha(alpha: number): void
  setFloatParameter(name: string, value: number): void
  setIntParameter(name: string, value: number): void
  setMat3fParameter(name: string, value: Mat3f): void
  setFloat3Parameter(name: string, vector: Float3): void
  /**
   * Changes the base color of the material.
   * Assumes linear (0-1) linear sRGB color space.
   */
  setFloat4Parameter(color: RGBA): void
  readonly name: string
}
