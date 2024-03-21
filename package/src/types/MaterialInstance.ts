export type CullingMode = 'none' | 'back' | 'front' | 'frontAndBack'

export type TransparencyMode = 'default' | 'twoPassesOneSide' | 'twoPassesTwoSides'

export interface MaterialInstance {
  setCullingMode(mode: CullingMode): void
  setTransparencyMode(mode: TransparencyMode): void
  changeAlpha(alpha: number): void
}
