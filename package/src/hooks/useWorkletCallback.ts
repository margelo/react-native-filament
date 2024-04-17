import { DependencyList } from 'react'
import { useWorklet } from 'react-native-worklets-core'
import { useFilamentContext } from '../FilamentContext'

/**
 * Creates a callback that can be executed in he separate worklet thread of the engine.
 */
export function useWorkletCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const { _workletContext } = useFilamentContext()

  const workletCallback = useWorklet(_workletContext, callback, deps)
  return workletCallback
}
