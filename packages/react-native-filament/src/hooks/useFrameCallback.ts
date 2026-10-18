import { useEffect, type DependencyList } from 'react'
import { useRenderCommit } from '../react/useRenderCommit'
import { useReportFailure } from '../react/useReportFailure'
import type { FrameInfo } from '../specs/types/FrameInfo'

/**
 * Calls the worklet `callback` on the render thread at the start of every frame while the component
 * is mounted, after transform bindings and camera manipulators are applied and before animation
 * players, physics and skeleton followers run. Keeps the Engine rendering in `on-demand` mode.
 */
export function useFrameCallback(callback: (frame: FrameInfo) => void, deps: DependencyList): void {
  const commit = useRenderCommit()
  const fail = useReportFailure()
  useEffect(() => {
    const { engine } = commit
    const subscribed = commit.run(() => {
      'worklet'
      return engine.addOnFrameListener((frame) => {
        callback(frame)
        return true
      })
    })
    subscribed.catch(fail)
    return () => {
      subscribed.then(
        (subscription) => subscription.remove(),
        () => undefined
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commit, ...deps])
}
