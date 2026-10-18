import { useEffect } from 'react'
import { bindSharedValue } from '../bindings/bindSharedValue'
import { isListenableValue } from '../bindings/isListenableValue'
import type { ListenableValue } from '../bindings/ListenableValue'
import { useRenderCommit } from '../react/useRenderCommit'
import type { ValueBinding } from '../specs/control/ValueBinding.nitro'
import { useDisposableResource } from './useDisposableResource'

/**
 * A `ValueBinding` that follows `value`, so render-thread worklets can read a SharedValue through
 * `binding.value` without waiting on the UI runtime.
 */
export function useValueBinding(value: number | ListenableValue<number>): ValueBinding | undefined {
  const { engine } = useRenderCommit()
  const shared = isListenableValue(value) ? value : undefined
  const fixed = shared == null ? (value as number) : undefined
  const binding = useDisposableResource(() => engine.createValueBinding(shared?.value ?? fixed ?? 0), [engine, shared])

  useEffect(() => {
    if (binding == null || fixed == null) return
    binding.set(fixed)
  }, [binding, fixed])

  useEffect(() => {
    if (binding == null || shared == null) return
    return bindSharedValue(shared, (next) => {
      'worklet'
      binding.set(next)
    })
  }, [binding, shared])

  return binding
}
