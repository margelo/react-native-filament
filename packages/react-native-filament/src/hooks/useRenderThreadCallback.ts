import { useCallback, type DependencyList } from 'react'
import { useRenderCommit } from '../react/useRenderCommit'

/** A function that runs the worklet `callback` on the render thread and resolves with its result. */
export function useRenderThreadCallback<Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
  deps: DependencyList
): (...args: Args) => Promise<Result> {
  const commit = useRenderCommit()
  return useCallback(
    (...args: Args) =>
      commit.run(() => {
        'worklet'
        return callback(...args)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commit, ...deps]
  )
}
