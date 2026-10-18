import { useEffect } from 'react'
import { bindSharedValue } from '../bindings/bindSharedValue'
import { isListenableValue } from '../bindings/isListenableValue'
import type { ListenableValue } from '../bindings/ListenableValue'
import { useAnimationPlayer } from '../hooks/useAnimationPlayer'
import type { AnimationItem } from './AnimationItem'
import { useModelContext } from './useModelContext'
import type { Animator as NativeAnimator } from '../specs/assets/Animator.nitro'

export interface AnimatorProps {
  /** The animation to play. Each new value starts it from the beginning. @default 0 */
  animationIndex?: number | ListenableValue<number>
  /** Seconds to blend from the previous animation. @default 0 */
  transitionDuration?: number
  /** @default true */
  loop?: boolean
  /** Playback rate; 1 is real time. @default 1 */
  speed?: number
  /**
   * Holds the animation at this time in seconds instead of playing it, for scrubbing. Accepts a
   * SharedValue.
   */
  time?: number | ListenableValue<number>
  /**
   * Called with the animations of the model once it has loaded, and again whenever this function
   * changes, so pass a stable function such as a state setter.
   */
  onAnimationsLoaded?: (animations: AnimationItem[]) => void
}

/**
 * Plays an animation of the parent `ModelInstance`, or of the first instance of the parent `Model`,
 * natively, without JS per frame, through an `AnimationPlayer`. Unmount it to stop.
 */
export function Animator({ animationIndex = 0, transitionDuration = 0, loop = true, speed = 1, time, onAnimationsLoaded }: AnimatorProps) {
  const instance = useModelContext('Animator').instances[0]!
  const player = useAnimationPlayer(instance)
  const shared = isListenableValue(animationIndex) ? animationIndex : undefined
  const fixed = shared == null ? (animationIndex as number) : undefined

  useEffect(() => {
    if (player == null || fixed == null) return
    player.play(fixed, { loop, speed, crossFadeSeconds: transitionDuration })
  }, [player, fixed, loop, speed, transitionDuration])

  const sharedTime = time != null && isListenableValue(time) ? time : undefined
  const fixedTime = sharedTime == null ? (time as number | undefined) : undefined
  const scrubs = time != null

  useEffect(() => {
    if (player == null || shared == null) return
    return bindSharedValue(shared, (index) => {
      'worklet'
      player.play(index, { loop, speed, crossFadeSeconds: transitionDuration })
      if (scrubs) player.pause()
    })
  }, [player, shared, loop, speed, transitionDuration, scrubs])
  useEffect(() => {
    if (player != null && scrubs) player.pause()
  }, [player, scrubs, fixed, shared])
  useEffect(() => {
    if (player != null && fixedTime != null) player.seek(fixedTime)
  }, [player, fixedTime, fixed, shared])
  useEffect(() => {
    if (player == null || sharedTime == null) return
    return bindSharedValue(sharedTime, (seconds) => {
      'worklet'
      player.seek(seconds)
    })
  }, [player, sharedTime, fixed, shared])

  useEffect(() => {
    if (onAnimationsLoaded == null) return
    onAnimationsLoaded(instance.animator.animations.map(({ name, durationSeconds }, index) => ({ index, name, duration: durationSeconds })))
  }, [instance, onAnimationsLoaded])

  return null
}

/** Applies the animations of one model instance. */
export type Animator = NativeAnimator
