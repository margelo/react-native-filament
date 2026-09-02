import type { WorkletFunction } from 'react-native-worklets'

/**
 * The values a worklet captured from its surrounding scope.
 * Use them as hook dependencies, so a worklet only re-runs when something it captured changed.
 */
export function getWorkletDependencies(worklet: (...args: any[]) => unknown): unknown[] {
  const closure = (worklet as Partial<WorkletFunction>).__closure
  return closure == null ? [] : Object.values(closure)
}
