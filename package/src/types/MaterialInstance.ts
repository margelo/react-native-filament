import { RGBA } from './Color'

export type CullingMode = 'none' | 'back' | 'front' | 'frontAndBack'

export type TransparencyMode = 'default' | 'twoPassesOneSide' | 'twoPassesTwoSides'

export interface MaterialInstance {
  setCullingMode(mode: CullingMode): void
  setTransparencyMode(mode: TransparencyMode): void
  changeAlpha(alpha: number): void
  setParameter(name: string, value: number): void
  /**
   * Changes the base color of the material.
   * Assumes linear (0-1) linear sRGB color space.
   */
  setBaseColorSRGB(color: RGBA): void
  readonly name: string
}
