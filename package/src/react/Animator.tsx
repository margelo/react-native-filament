import React, { useEffect } from 'react'
import { FilamentInstance } from '../types'
import { RenderCallbackContext } from './RenderCallbackContext'
import { useAnimator } from '../hooks/useAnimator'
import { ISharedValue, useSharedValue } from 'react-native-worklets-core'
import usePrevious from '../hooks/usePrevious'
import { ParentInstancesContext } from './ParentInstancesContext'

export type AnimationItem = {
  index: number
  duration: number
  name: string
}

type Props = {
  /**
   * The index of the animation to play. To find out the index for the animation you want to play, you can use the `onAnimationsLoaded` callback.
   * @default 0
   **/
  animationIndex?: number | ISharedValue<number>

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
 */
export function Animator(props: Props) {
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

type ImplProps = Props & {
  instance: FilamentInstance
}

function AnimatorImpl({ instance, animationIndex: animationIndexProp = 0, transitionDuration = 0, onAnimationsLoaded }: ImplProps) {
  const animator = useAnimator(instance)

  // State for cross fading animations
  const prevAnimationIndex = useSharedValue<number | undefined>(undefined)
  const prevAnimationStarted = useSharedValue<number | undefined>(undefined)
  const animationInterpolation = useSharedValue(0)

  RenderCallbackContext.useRenderCallback(
    ({ passedSeconds }) => {
      'worklet'
      if (animator == null) {
        return
      }

      const animationIndex = typeof animationIndexProp === 'number' ? animationIndexProp : animationIndexProp.value

      animator.applyAnimation(animationIndex, passedSeconds)

      // Eventually apply a cross fade
      if (prevAnimationIndex.value != null && transitionDuration > 0) {
        if (prevAnimationStarted.value == null) {
          prevAnimationStarted.value = passedSeconds
        }
        animationInterpolation.value += passedSeconds - prevAnimationStarted.value!
        const alpha = animationInterpolation.value / transitionDuration

        // Blend animations using a cross fade
        animator.applyCrossFade(prevAnimationIndex.value, prevAnimationStarted.value!, alpha)

        // Reset the prev animation once the transition is completed
        if (alpha >= 1) {
          prevAnimationIndex.value = undefined
          prevAnimationStarted.value = undefined
          animationInterpolation.value = 0
        }
      }

      animator.updateBoneMatrices()
    },
    [animator, animationIndexProp]
  )

  // Update prevAnimationIndex when animationIndexProp changes
  const previousAnimationIndexProp = usePrevious(animationIndexProp)
  useEffect(() => {
    // Update previous index if the prop is just a number:
    if (typeof animationIndexProp === 'number') {
      if (typeof previousAnimationIndexProp !== 'number') return

      prevAnimationIndex.value = previousAnimationIndexProp
      return
    }

    // Update previous index if the prop is a shared value:
    let value = animationIndexProp.value
    const removeListener = animationIndexProp.addListener(() => {
      prevAnimationIndex.value = value
      value = animationIndexProp.value
    })
    return () => {
      removeListener()
    }
  }, [animationIndexProp, prevAnimationIndex, previousAnimationIndexProp])

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
