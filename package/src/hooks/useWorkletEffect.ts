import { useEffect } from 'react'
import { useFilamentContext } from './useFilamentContext'
import { scheduleOnRuntime } from 'react-native-worklets'
import { scheduleOnRuntimeAsync } from '../utilities/scheduleOnRuntimeAsync'

type CleanupFn = () => void

export function useWorkletEffect(workletFunction: () => CleanupFn | void) {
  const { workletRuntime } = useFilamentContext()

  useEffect(() => {
    const cleanupPromise = scheduleOnRuntimeAsync(workletRuntime, workletFunction)
    return () => {
      cleanupPromise.then((cleanup): void => {
        if (cleanup == null || typeof cleanup !== 'function') {
          // no cleanup function was returned, do nothing.
          return
        }
        scheduleOnRuntime(workletRuntime, cleanup)
      })
    }
  }, [workletFunction, workletRuntime])
}
