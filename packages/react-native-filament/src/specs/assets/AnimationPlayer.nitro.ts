import type { HybridObject } from 'react-native-nitro-modules'
import type { PlayOptions } from '../types/PlayOptions'

export interface AnimationPlayer extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Plays an animation natively every frame. Applied at the next frame start.
   * @thread any
   */
  play(animationIndex: number, options: PlayOptions): void
  /** @thread any */
  pause(): void
  /** @thread any */
  seek(timeSeconds: number): void
}
