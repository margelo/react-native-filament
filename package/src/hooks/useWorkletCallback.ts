import { useMemo } from 'react'
import { runOnRuntimeAsync } from 'react-native-worklets'
import { useFilamentContext } from './useFilamentContext'
import { wrapWithErrorHandler } from '../ErrorUtils'
import { getWorkletDependencies } from '../utilities/worklets'

/**
 * Wraps a worklet in a JS function that runs it on the engine's worklet runtime and resolves with its result.
 *
 * Call the returned function from JS. Do not capture it inside another worklet or hand it to native code
 * (e.g. a collision callback): on the worklet runtime it is a remote function and cannot be invoked.
 * Pass the plain `'worklet'` function in those cases.
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
