import { useEffect } from 'react'
import { isWorkletFunction, runOnRuntimeAsync, scheduleOnRuntime } from 'react-native-worklets'
import { useFilamentContext } from './useFilamentContext'
import { wrapWithErrorHandler } from '../ErrorUtils'
import { getWorkletDependencies } from '../utilities/worklets'

type CleanupFn = () => void

export function useWorkletEffect(workletFunction: () => CleanupFn | void) {
  const { workletRuntime } = useFilamentContext()

  useEffect(() => {
    const cleanupPromise = runOnRuntimeAsync(workletRuntime, wrapWithErrorHandler(workletFunction))
    return () => {
      cleanupPromise.then((cleanup): void => {
        if (cleanup == null || typeof cleanup !== 'function') {
          // no cleanup function was returned, do nothing.
          return
        }
        if (isWorkletFunction(cleanup)) {
          // call cleanup function on the Filament runtime
          scheduleOnRuntime(workletRuntime, cleanup)
        } else {
          // call normal cleanup JS function on normal context
          cleanup()
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workletRuntime, ...getWorkletDependencies(workletFunction)])
}
