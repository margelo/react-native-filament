import type { HybridObject } from 'react-native-nitro-modules'
import type { PlayOptions } from '../types/PlayOptions'

/**
 * Plays the animations of one model instance natively every frame, without JS per frame. Create one
 * with `Animator.createPlayer()`. Playback stops when the player is disposed or garbage collected,
 * so keep a reference; methods called after `dispose()` throw. Players run after frame listeners,
 * so they override poses applied by hand to the same instance.
 */
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
