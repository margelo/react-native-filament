import type { DependencyList } from 'react'
import { useRenderThreadMemo } from './useRenderThreadMemo'

/**
 * The result of the worklet `factory`, computed on the render thread whenever `deps` change, or
 * `undefined` until the first result arrives, as in 1.x. It is `useRenderThreadMemo` under its 1.x name.
 */
export function useWorkletMemo<T>(factory: () => T, deps: DependencyList): T | undefined {
  return useRenderThreadMemo(factory, deps)
}
