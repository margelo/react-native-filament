import { useEffect, useRef, type DependencyList } from 'react'
import { useRenderCommit } from '../react/useRenderCommit'
import { useReportFailure } from '../react/useReportFailure'
import type { RenderThreadCleanup } from '../specs/engine/RenderThreadCleanup.nitro'

/**
 * Runs the worklet `effect` on the render thread after a commit in which `deps` changed. A function
 * it returns runs on the render thread before the next run and on unmount, always in that order, and
 * may capture any value of the render runtime. A failure is thrown to the closest error boundary.
 */
export function useRenderThreadEffect(effect: () => (() => void) | void, deps: DependencyList): void {
  const commit = useRenderCommit()
  const fail = useReportFailure()
  const cleanupRunning = useRef<Promise<void>>(undefined)

  useEffect(() => {
    const { engine } = commit
    const start = () =>
      commit.run((): RenderThreadCleanup | undefined => {
        'worklet'
        const cleanup = effect()
        if (cleanup == null) return undefined
        const thread = engine.renderThread
        return thread.retainCleanup(() => {
          if (thread.isCurrentThread) cleanup()
        })
      })
    const previous = cleanupRunning.current
    const started = previous == null ? start() : previous.then(start)
    started.catch(fail)
    let settled = false
    let handle: RenderThreadCleanup | undefined
    started.then(
      (result) => {
        settled = true
        handle = result
      },
      () => {
        settled = true
      }
    )
    return () => {
      if (settled) {
        handle?.run()
        return
      }
      const running = started.then(
        (result) => result?.run(),
        () => undefined
      )
      cleanupRunning.current = running
      running.then(() => {
        if (cleanupRunning.current === running) cleanupRunning.current = undefined
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commit, ...deps])
}
