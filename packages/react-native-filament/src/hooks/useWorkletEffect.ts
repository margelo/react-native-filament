import { workletDependencies } from '../threading/workletDependencies'
import { useRenderThreadEffect } from './useRenderThreadEffect'

/**
 * Runs the worklet `effect` on the render thread whenever a value it captures changes, as in 1.x. It is
 * `useRenderThreadEffect` with the captured values as dependencies; a function it returns runs on the
 * render thread before the next run and on unmount.
 */
export function useWorkletEffect(effect: () => (() => void) | void): void {
  useRenderThreadEffect(effect, workletDependencies(effect))
}
