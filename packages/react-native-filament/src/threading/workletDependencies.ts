import type { DependencyList } from 'react'
import { isWorkletFunction } from 'react-native-worklets'

/** The values `worklet` captures, which the 1.x worklet hooks use as their dependencies. */
export function workletDependencies(worklet: (...args: never[]) => unknown): DependencyList {
  return isWorkletFunction(worklet) ? Object.values(worklet.__closure) : [worklet]
}
