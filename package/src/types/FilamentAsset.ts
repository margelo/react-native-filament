import type { Animator } from './Animator'
import type { Entity } from './Entity'

export interface FilamentAsset {
  getRoot(): Entity

  getAnimator(): Animator
  /**
   * Reclaims CPU-side memory for URI strings, binding lists, and raw animation data.
   */
  releaseSourceData(): void

  /**
   * Creates a new animator with the animations from the given asset.
   */
  createAnimatorWithAnimationsFrom(asset: FilamentAsset): Animator
}
