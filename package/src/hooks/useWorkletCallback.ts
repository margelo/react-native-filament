import { useWorklet } from 'react-native-worklets-core'
import { useFilamentContext } from './useFilamentContext'
import { wrapWithErrorHandler } from '../ErrorUtils'

/**
 * Creates a callback that can be executed in he separate worklet thread of the engine.
 */
export function useWorkletCallback<T extends (...args: any[]) => any>(callback: T): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const { workletContext } = useFilamentContext()

  return useWorklet(workletContext, wrapWithErrorHandler(callback))
}
