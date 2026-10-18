import type { ListenableValue } from './ListenableValue'

/** Whether `value` is a Reanimated-style SharedValue rather than a plain value. Runs in any runtime. */
export function isListenableValue<T>(value: T | ListenableValue<T>): value is ListenableValue<T> {
  'worklet'
  return typeof value === 'object' && value != null && 'addListener' in value && 'removeListener' in value && 'value' in value
}
