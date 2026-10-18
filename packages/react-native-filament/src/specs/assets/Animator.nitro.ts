import type { HybridObject } from 'react-native-nitro-modules'
import type { AnimationInfo } from '../types/AnimationInfo'
import type { AnimationPlayer } from './AnimationPlayer.nitro'

/**
 * Applies the glTF animations of one model instance. Get it from `ModelInstance.animator`; apply
 * animations from a render-thread worklet or use `createPlayer()` to play them natively.
 */
export interface Animator extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly animations: AnimationInfo[]
  /** @thread render */
  applyAnimation(animationIndex: number, timeSeconds: number): void
  /** @thread render */
  applyCrossFade(previousIndex: number, previousTimeSeconds: number, alpha: number): void
  /** @thread render */
  updateBoneMatrices(): void
  /** @thread render */
  resetBoneMatrices(): void
  /**
   * A player that animates this instance natively, without JS per frame.
   * @thread any
   */
  createPlayer(): AnimationPlayer
}
