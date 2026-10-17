import type { HybridObject } from 'react-native-nitro-modules'
import type { AnimationInfo } from '../types/AnimationInfo'
import type { AnimationPlayer } from './AnimationPlayer.nitro'

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
