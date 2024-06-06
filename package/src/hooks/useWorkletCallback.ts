import { useWorklet } from 'react-native-worklets-core'
import { useFilamentContext } from '../react/FilamentContext'
import { reportWorkletError } from '../ErrorUtils'

/**
 * Creates a callback that can be executed in he separate worklet thread of the engine.
 */
export function useWorkletCallback<T extends (...args: any[]) => any>(callback: T): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const { workletContext } = useFilamentContext()

  const workletCallback = useWorklet(workletContext, () => {
    'worklet'
    try {
      return callback()
    } catch (error) {
      reportWorkletError(error)
      throw error
    }
  })
  return workletCallback
}
