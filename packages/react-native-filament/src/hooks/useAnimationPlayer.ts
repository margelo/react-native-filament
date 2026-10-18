import type { AnimationPlayer } from '../specs/assets/AnimationPlayer.nitro'
import type { ModelInstance } from '../specs/assets/ModelInstance.nitro'
import { useDisposableResource } from './useDisposableResource'

/** A native player for the animations of `instance`, disposed on unmount. */
export function useAnimationPlayer(instance: ModelInstance | undefined): AnimationPlayer | undefined {
  return useDisposableResource(() => instance?.animator.createPlayer(), [instance])
}
