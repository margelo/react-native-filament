import { useMemo } from 'react'
import type { Animator } from '../specs/assets/Animator.nitro'
import type { ModelInstance } from '../specs/assets/ModelInstance.nitro'
import type { FilamentModel } from './FilamentModel'

/** The animator of a loaded model's first instance, or of `instance`. The instance owns it. */
export function useAnimator(source: FilamentModel | ModelInstance | undefined): Animator | undefined {
  const model = source != null && 'state' in source && source.state === 'loaded' ? source.model : undefined
  const instance = useMemo(
    () => (model != null ? model.getInstance(0) : source != null && !('state' in source) ? source : undefined),
    [model, source]
  )
  return useMemo(() => instance?.animator, [instance])
}
