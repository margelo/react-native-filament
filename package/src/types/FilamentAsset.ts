import type { Animator } from './Animator'
import type { Entity } from './Entity'

export interface FilamentAsset {
  getRoot(): Entity

  getAnimator(): Animator
  /**
   * Reclaims CPU-side memory for URI strings, binding lists, and raw animation data.
   */
  releaseSourceData(): void
}
