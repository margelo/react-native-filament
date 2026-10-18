import type { ListenableValue } from '../bindings/ListenableValue'
import type { Entity } from '../specs/types/Entity'
import { useFilamentScene } from './useFilamentScene'
import { useLiveValue } from './useLiveValue'

interface MaterialParameterProps {
  entity: Entity
  primitiveIndex: number
  name: string
  value: number | readonly number[] | ListenableValue<number | readonly number[]>
}

/** Sets one float, float3 or float4 parameter of the material instance of a primitive. */
export function MaterialParameter({ entity, primitiveIndex, name, value }: MaterialParameterProps) {
  const { renderableManager } = useFilamentScene()
  useLiveValue(
    value,
    (next) => {
      'worklet'
      const instance = renderableManager.getMaterialInstanceAt(entity, primitiveIndex)
      if (typeof next === 'number') instance.setFloatParameter(name, next)
      else if (next.length === 3) instance.setFloat3Parameter(name, [next[0]!, next[1]!, next[2]!])
      else instance.setFloat4Parameter(name, [next[0]!, next[1]!, next[2]!, next[3]!])
    },
    [renderableManager, entity, primitiveIndex, name]
  )
  return null
}
