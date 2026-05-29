import { useFilamentContext } from './useFilamentContext'
import { useCallback } from 'react'
import { scheduleOnRuntimeAsync } from '../utilities/scheduleOnRuntimeAsync'

/**
 * Creates a callback that can be executed in he separate worklet thread of the engine.
 */
export function useWorkletCallback<T extends (...args: any[]) => any>(callback: T): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const { workletRuntime } = useFilamentContext()

  return useCallback(() => {
    return scheduleOnRuntimeAsync(workletRuntime, callback)
  }, [callback, workletRuntime])
}
