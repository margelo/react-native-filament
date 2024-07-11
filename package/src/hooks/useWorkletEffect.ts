import { useEffect } from 'react'
import { useFilamentContext } from './useFilamentContext'
import { getWorkletDependencies, isWorklet } from 'react-native-worklets-core'
import { wrapWithErrorHandler } from '../ErrorUtils'

type CleanupFn = () => void

export function useWorkletEffect(workletFunction: () => CleanupFn | void) {
  const { workletContext } = useFilamentContext()

  useEffect(() => {
    const cleanupPromise = workletContext.runAsync(wrapWithErrorHandler(workletFunction))
    return () => {
      cleanupPromise.then((cleanup): void => {
        if (cleanup == null || typeof cleanup !== 'function') {
          // no cleanup function was returned, do nothing.
          return
        }
        if (isWorklet(cleanup)) {
          // call cleanup function on Worklet context
          workletContext.runAsync(cleanup)
        } else {
          // call normal cleanup JS function on normal context
          cleanup()
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, getWorkletDependencies(workletFunction))
}
