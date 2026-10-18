import { workletDependencies } from '../threading/workletDependencies'
import { useRenderThreadCallback } from './useRenderThreadCallback'

/**
 * A function that runs the worklet `callback` on the render thread and resolves with its result, as in
 * 1.x. It is `useRenderThreadCallback` with the values `callback` captures as dependencies.
 */
export function useWorkletCallback<Args extends unknown[], Result>(
  callback: (...args: Args) => Result
): (...args: Args) => Promise<Result> {
  return useRenderThreadCallback(callback, workletDependencies(callback))
}
