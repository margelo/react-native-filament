import { useEffect, type DependencyList } from 'react'
import { bindSharedValue } from '../bindings/bindSharedValue'
import { isListenableValue } from '../bindings/isListenableValue'
import type { ListenableValue } from '../bindings/ListenableValue'
import { useRenderCommit } from './useRenderCommit'
import { useReportFailure } from './useReportFailure'

type Numeric = number | readonly number[]

/**
 * Applies `value` with the worklet `apply` on the render thread: once per change of a plain value, or
 * at the start of the first frame after a SharedValue changed, through `ValueBinding`s.
 */
export function useLiveValue<T extends Numeric>(
  value: T | ListenableValue<T> | undefined,
  apply: (value: T) => void,
  deps: DependencyList
): void {
  const commit = useRenderCommit()
  const fail = useReportFailure()
  const shared = value != null && isListenableValue(value) ? value : undefined
  const fixed = value != null && shared == null ? (value as T) : undefined
  const fixedKey = fixed == null ? undefined : JSON.stringify(fixed)

  useEffect(() => {
    if (fixed == null) return
    commit
      .run(() => {
        'worklet'
        apply(fixed)
      })
      .catch(fail)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commit, fixedKey, ...deps])

  useEffect(() => {
    if (shared == null) return
    const { engine } = commit
    const initial = shared.value
    const isList = Array.isArray(initial)
    const components: readonly number[] = isList ? (initial as readonly number[]) : [initial as number]
    const bindings = components.map((component) => engine.createValueBinding(component))
    const unbind = bindSharedValue(shared, (next) => {
      'worklet'
      if (Array.isArray(next)) next.forEach((component: number, index: number) => bindings[index]?.set(component))
      else bindings[0]!.set(next as number)
    })
    const subscribed = commit.run(() => {
      'worklet'
      let applied: number[] = []
      return engine.addOnFrameListener(() => {
        const latest = bindings.map((binding) => binding.value)
        if (latest.some((component, index) => component !== applied[index])) {
          applied = latest
          apply((isList ? latest : latest[0]) as T)
        }
        return false
      })
    })
    subscribed.catch(fail)
    return () => {
      unbind()
      subscribed.then(
        (subscription) => subscription.remove(),
        () => undefined
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commit, shared, ...deps])
}
