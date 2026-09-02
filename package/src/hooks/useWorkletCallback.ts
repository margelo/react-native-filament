import { useMemo } from 'react'
import { runOnRuntimeAsync } from 'react-native-worklets'
import { useFilamentContext } from './useFilamentContext'
import { wrapWithErrorHandler } from '../ErrorUtils'
import { getWorkletDependencies } from '../utilities/worklets'

/**
 * Creates a callback that can be executed in he separate worklet thread of the engine.
 */
export function useWorkletCallback<T extends (...args: any[]) => any>(callback: T): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const { workletRuntime } = useFilamentContext()

  // The dependencies are the values captured inside the worklet, so the returned callback
  // stays the same for as long as the worklet's closure doesn't change.
  return useMemo(
    () => {
      const worklet = wrapWithErrorHandler(callback)
      return (...args: Parameters<T>) => runOnRuntimeAsync(workletRuntime, worklet, ...args)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workletRuntime, ...getWorkletDependencies(callback)]
  )
}
