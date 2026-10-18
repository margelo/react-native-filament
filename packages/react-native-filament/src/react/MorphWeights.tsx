import type { ListenableValue } from '../bindings/ListenableValue'
import type { Entity } from '../specs/types/Entity'
import { useFilamentScene } from './useFilamentScene'
import { useLiveValue } from './useLiveValue'

interface MorphWeightsProps {
  entity: Entity
  weights: number[] | ListenableValue<number[]>
}

export function MorphWeights({ entity, weights }: MorphWeightsProps) {
  const { renderableManager } = useFilamentScene()
  useLiveValue(
    weights,
    (next) => {
      'worklet'
      renderableManager.setMorphWeights(entity, [...next], 0)
    },
    [renderableManager, entity]
  )
  return null
}
