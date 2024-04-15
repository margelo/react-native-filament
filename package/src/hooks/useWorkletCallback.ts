import { DependencyList, useMemo } from 'react'
import { useWorklet } from 'react-native-worklets-core'
import { FilamentProxy } from '../native/FilamentProxy'

/**
 * Creates a callback that can be executed in he separate worklet thread of the engine.
 */
export function useWorkletCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const workletContext = useMemo(() => FilamentProxy.getWorkletContext(), [])

  const workletCallback = useWorklet(workletContext, callback, deps)
  return workletCallback
}
