import React, { useEffect } from 'react'
import { ParentModelAssetContext } from './ParentModelAssetContext'
import { FilamentAsset } from '../types'
import { RenderCallbackContext } from './RenderCallbackContext'
import { useAnimator } from '../hooks/useAnimator'

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
  animationIndex?: number

  /**
   * Returns a list of all animations for the model.
   */
  onAnimationsLoaded?: (animations: AnimationItem[]) => unknown
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
  const parentAsset = React.useContext(ParentModelAssetContext)

  if (parentAsset == null) {
    throw new Error('Animator must be used inside a <Model> component.')
  }

  return <AnimatorImpl asset={parentAsset} {...props} />
}

type ImplProps = Props & {
  asset: FilamentAsset
}

function AnimatorImpl({ asset, animationIndex = 0, onAnimationsLoaded }: ImplProps) {
  const animator = useAnimator(asset)

  RenderCallbackContext.useRenderCallback(
    ({ passedSeconds }) => {
      'worklet'
      if (animator == null) {
        return
      }

      animator.applyAnimation(animationIndex, passedSeconds)
      animator.updateBoneMatrices()
    },
    [animator]
  )

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
