import { scheduleOnUI } from 'react-native-worklets'
import type { ListenableValue } from './ListenableValue'

let nextListenerId = 0x52_4e_46_00

/**
 * Calls the worklet `apply` on the UI runtime with the current value and then with every new value,
 * typically to write a `TransformBinding` or `ValueBinding`. No JS thread work per update.
 * Returns a function that removes the listener.
 */
export function bindSharedValue<T>(value: ListenableValue<T>, apply: (value: T) => void): () => void {
  const listenerId = nextListenerId++
  scheduleOnUI(() => {
    'worklet'
    apply(value.value)
    value.addListener(listenerId, apply)
  })
  return () => {
    scheduleOnUI(() => {
      'worklet'
      value.removeListener(listenerId)
    })
  }
}
