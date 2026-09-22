import React, { useCallback, useEffect, useMemo } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import { createSynchronizable, scheduleOnRuntime } from 'react-native-worklets'
import { FilamentInstance } from '../types'
import { RenderCallbackContext } from './RenderCallbackContext'
import { useAnimator } from '../hooks/useAnimator'
import { useFilamentContext } from '../hooks/useFilamentContext'
import { useSharedValueListener } from '../hooks/useSharedValueListener'
import { ParentInstancesContext } from './ParentInstancesContext'

export type AnimationItem = {
  index: number
  duration: number
  name: string
}

export type AnimatorProps = {
  /**
   * The index of the animation to play. To find out the index for the animation you want to play, you can use the `onAnimationsLoaded` callback.
   * @default 0
   **/
  animationIndex?: number | SharedValue<number>

  /**
   * Returns a list of all animations for the model.
   */
  onAnimationsLoaded?: (animations: AnimationItem[]) => unknown

  /**
   * The time it takes transitioning from one animation to another.
   * At 0 the transition is immediate. Unit is seconds.
   * @default 0
   */
  transitionDuration?: number
}

/**
 * Can be used to control the animation of a Model.
 * For pausing, playing, it is recommended to conditionally render the Animator component.
 *
 * @example
 * ```jsx
 * <Model source={DroneGlb}>
 *  <Animator animationIndex={2} />
 * </Model>
 * ```
 */
export function Animator(props: AnimatorProps) {
  const instances = React.useContext(ParentInstancesContext)
  if (instances == null) {
    throw new Error('Animator must be used inside a <Model> or <ModelInstance> component.')
  }
  const instance = instances[0]
  if (instance == null) {
    // Should never happen
    throw new Error('No instances found for the parent Model component. This is a bug.')
  }

  return <AnimatorImpl instance={instance} {...props} />
}

type ImplProps = AnimatorProps & {
  instance: FilamentInstance
}

/**
 * The animation state, shared between the JS thread and the Filament runtime.
 */
type AnimationState = {
  index: number
  // Set when the index changed, for cross fading from the previous animation
  previousIndex: number | undefined
  transitionStart: number | undefined
  transitionElapsed: number
}

function AnimatorImpl({ instance, animationIndex: animationIndexProp = 0, transitionDuration = 0, onAnimationsLoaded }: ImplProps) {
  const animator = useAnimator(instance)
  const { workletRuntime } = useFilamentContext()

  const state = useMemo(
    () =>
      createSynchronizable<AnimationState>({
        index: typeof animationIndexProp === 'number' ? animationIndexProp : animationIndexProp.value,
        previousIndex: undefined,
        transitionStart: undefined,
        transitionElapsed: 0,
      }),
    // The initial value is only read once, changes come in through switchAnimation
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const switchAnimation = useCallback(
    (index: number) => {
      'worklet'
      state.setBlocking((current) =>
        current.index === index ? current : { index, previousIndex: current.index, transitionStart: undefined, transitionElapsed: 0 }
      )
    },
    [state]
  )

  // Switch animation when the prop is a number
  useEffect(() => {
    if (typeof animationIndexProp !== 'number') return
    scheduleOnRuntime(workletRuntime, switchAnimation, animationIndexProp)
  }, [animationIndexProp, switchAnimation, workletRuntime])

  // Switch animation when the prop is a shared value
  useSharedValueListener(typeof animationIndexProp === 'number' ? undefined : animationIndexProp, switchAnimation)

  RenderCallbackContext.useRenderCallback(
    ({ passedSeconds }) => {
      'worklet'
      if (animator == null) {
        return
      }

      const current = state.getBlocking()
      animator.applyAnimation(current.index, passedSeconds)

      // Eventually apply a cross fade
      if (current.previousIndex != null && transitionDuration > 0) {
        const transitionStart = current.transitionStart ?? passedSeconds
        const transitionElapsed = current.transitionElapsed + (passedSeconds - transitionStart)
        const alpha = transitionElapsed / transitionDuration

        // Blend animations using a cross fade
        animator.applyCrossFade(current.previousIndex, transitionStart, alpha)

        // Reset the prev animation once the transition is completed
        state.setBlocking(
          alpha >= 1
            ? { index: current.index, previousIndex: undefined, transitionStart: undefined, transitionElapsed: 0 }
            : { ...current, transitionStart, transitionElapsed }
        )
      }

      animator.updateBoneMatrices()
    },
    [animator, state, transitionDuration]
  )

  // Get all animations and return them using the onAnimationsLoaded callback
  useEffect(() => {
    if (animator == null || onAnimationsLoaded == null) {
      return
    }

    const animations: AnimationItem[] = []
    for (let i = 0; i < animator.getAnimationCount(); i++) {
      animations.push({
        index: i,
        duration: animator.getAnimationDuration(i),
        name: animator.getAnimationName(i),
      })
    }

    onAnimationsLoaded(animations)
  }, [animator, onAnimationsLoaded])

  return null
}
