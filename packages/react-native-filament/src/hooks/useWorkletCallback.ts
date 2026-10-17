import { getWorkletDependencies } from 'react-native-worklets-core'
import { useFilamentContext } from './useFilamentContext'
import { wrapWithErrorHandler } from '../ErrorUtils'
import { useMemo } from 'react'

/**
 * Creates a callback that can be executed in he separate worklet thread of the engine.
 */
export function useWorkletCallback<T extends (...args: any[]) => any>(callback: T): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const { workletContext } = useFilamentContext()

  // Note: from react-native-worklets-core/useWorklet
  // As we want to wrap using `wrapWithErrorHandler` the dependencies must be captured from the
  // callback, not from the wrapper.

  // As a dependency for this use-memo we use all of the values captured inside the worklet,
  // as well as the unique context name.
  const dependencies = [...getWorkletDependencies(callback)]

  return useMemo(
    () => {
      return workletContext.createRunAsync(wrapWithErrorHandler(callback))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies
  )
}
