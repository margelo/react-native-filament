import { type SharedValue as ReanimatedSharedValue } from 'react-native-reanimated'
import { useSharedValue, type ISharedValue as WorkletsCoreSharedValue } from 'react-native-worklets-core'
import { useFilamentContext } from './useFilamentContext'
import { useEffect } from 'react'
import { ReanimatedProxy } from '../dependencies/ReanimatedProxy'

/**
 * react-native-filament uses react-native-worklets-core for creating shared values, which works very similar to
 * react-native-reanimated's shared values. However, you can't pass a reanimated shared value to a worklets core shared value directly.
 * This hook allows you to sync a reanimated shared value with a worklets core shared value.
 *
 * @example
 * ```tsx
 * const reanimatedSharedValue = useSharedValue(0)
 * const workletsCoreSharedValue = useSyncSharedValue(reanimatedSharedValue)
 *
 * // animate reanimatedSharedValue
 *
 * return <ModelInstance index={0} rotate={workletsCoreSharedValue} />
 * ```
 */
export function useSyncSharedValue<T>(reanimatedSharedValue: ReanimatedSharedValue<T>): WorkletsCoreSharedValue<T> {
  const workletsCoreSharedValue = useSharedValue(reanimatedSharedValue.value)
  const { workletContext } = useFilamentContext()

  // Attach a listener to the reanimated value that runs on the UI thread and updates the worklets core shared value
  useEffect(() => {
    const id = Math.floor(Math.random() * 1000000)

    const callback = workletContext.createRunAsync((value: T) => {
      'worklet'
      workletsCoreSharedValue.value = value
    })

    ReanimatedProxy.runOnUI(() => {
      'worklet'
      reanimatedSharedValue.addListener(id, callback)
    })()

    return () => {
      ReanimatedProxy.runOnUI(() => {
        'worklet'
        reanimatedSharedValue.removeListener(id)
      })()
    }
  }, [reanimatedSharedValue, workletContext, workletsCoreSharedValue])

  return workletsCoreSharedValue
}
