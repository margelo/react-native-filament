import { useEffect } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import { scheduleOnRuntime, scheduleOnUI } from 'react-native-worklets'
import { useFilamentContext } from './useFilamentContext'
import { getWorkletDependencies } from '../utilities/worklets'

declare global {
  var __rnfSharedValueListeners: Record<number, (_value: any) => void> | undefined
}

let nextListenerId = 0

/**
 * Runs `apply` (a worklet) on the Filament runtime with the current value of a reanimated shared
 * value, and again every time the value changes.
 *
 * Reanimated only allows listeners on the UI runtime, so the listener lives there and forwards
 * every change to the Filament runtime. A worklet that was captured from JS can't be handed from the
 * UI runtime to another runtime, so `apply` is registered on the Filament runtime by id from JS and
 * the UI listener only sends the id and the new value.
 */
export function useSharedValueListener<T>(value: SharedValue<T> | undefined, apply: (value: T) => void): void {
  const { workletRuntime } = useFilamentContext()

  useEffect(() => {
    if (value == null) return
    const listenerId = nextListenerId++

    scheduleOnRuntime(
      workletRuntime,
      (id: number, initialValue: T) => {
        'worklet'
        const listeners = (globalThis.__rnfSharedValueListeners ??= {})
        listeners[id] = apply
        apply(initialValue)
      },
      listenerId,
      value.value
    )
    scheduleOnUI(() => {
      'worklet'
      value.addListener(listenerId, (newValue: T) => {
        scheduleOnRuntime(
          workletRuntime,
          (id: number, forwardedValue: T) => {
            'worklet'
            globalThis.__rnfSharedValueListeners?.[id]?.(forwardedValue)
          },
          listenerId,
          newValue
        )
      })
    })

    return () => {
      scheduleOnUI(() => {
        'worklet'
        value.removeListener(listenerId)
      })
      scheduleOnRuntime(
        workletRuntime,
        (id: number) => {
          'worklet'
          delete globalThis.__rnfSharedValueListeners?.[id]
        },
        listenerId
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, workletRuntime, ...getWorkletDependencies(apply)])
}
