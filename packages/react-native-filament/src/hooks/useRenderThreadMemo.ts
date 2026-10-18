import { useEffect, useState, type DependencyList } from 'react'
import { useRenderCommit } from '../react/useRenderCommit'
import { useReportFailure } from '../react/useReportFailure'

/**
 * The result of the worklet `factory`, computed on the render thread whenever `deps` change, or
 * `undefined` until the first result arrives. Results of outdated `deps` are dropped.
 */
export function useRenderThreadMemo<T>(factory: () => T, deps: DependencyList): T | undefined {
  const commit = useRenderCommit()
  const fail = useReportFailure()
  const [result, setResult] = useState<{ value: T }>()
  useEffect(() => {
    let current = true
    commit.run(factory).then(
      (value) => {
        if (current) setResult({ value })
      },
      (error: unknown) => {
        if (current) fail(error)
      }
    )
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commit, ...deps])
  return result?.value
}
