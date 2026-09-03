import { useEffect, useMemo, useRef } from 'react'
import { createSynchronizable } from 'react-native-worklets'
import { TransformationProps } from '../../types/TransformProps'
import { useFilamentContext } from '../useFilamentContext'
import { AABB, Entity, Float3 } from '../../types'
import { areFloat3Equal, isWorkletSharedValue } from '../../utilities/helper'
import { useSharedValueListener } from '../useSharedValueListener'

type Params = {
  // If null it will not take the entity from the context, as it indicates that it will be provided through the param
  to?: Entity | null
  transformProps?: TransformationProps
  // If transformToUnitCube is true, the aabb is required
  aabb?: AABB
}

/**
 * Takes the next entity from the context and applies all transformations from the next
 * transformation context to it
 */
export function useApplyTransformations({ to: entity, transformProps, aabb }: Params) {
  const { translate: position, scale, rotate, transformToUnitCube, multiplyWithCurrentTransform = true } = transformProps ?? {}

  const { transformManager } = useFilamentContext()
  // TODO: multiplying current transformations is a bit problematic with react.
  // E.g. in strict mode or concurrent rendering our effects can be called multiple times.
  // Running an effect multiple times with transformation multiplication can lead to unexpected results.
  const prevScale = useRef<Float3 | null>(null)
  const prevRotate = useRef<Float3 | null>(null)
  const prevPosition = useRef<Float3 | null>(null)

  useEffect(() => {
    if (entity == null) return

    if (transformToUnitCube && aabb != null) {
      transformManager.transformToUnitCube(entity, aabb)
    }

    if (!isWorkletSharedValue(scale) && Array.isArray(scale) && (prevScale.current == null || !areFloat3Equal(scale, prevScale.current))) {
      transformManager.setEntityScale(entity, scale, multiplyWithCurrentTransform)
      prevScale.current = scale
    }

    if (
      !isWorkletSharedValue(rotate) &&
      Array.isArray(rotate) &&
      (prevRotate.current == null || !areFloat3Equal(rotate, prevRotate.current))
    ) {
      const [x, y, z] = rotate
      transformManager.setEntityRotation(entity, x, [1, 0, 0], multiplyWithCurrentTransform)
      // Rotation across axis is one operation so we need to always multiply the remaining rotations:
      transformManager.setEntityRotation(entity, y, [0, 1, 0], true)
      transformManager.setEntityRotation(entity, z, [0, 0, 1], true)
      prevRotate.current = rotate
    }

    if (
      !isWorkletSharedValue(position) &&
      Array.isArray(position) &&
      (prevPosition.current == null || !areFloat3Equal(position, prevPosition.current))
    ) {
      transformManager.setEntityPosition(entity, position, multiplyWithCurrentTransform)
      prevPosition.current = position
    }
  }, [
    aabb,
    entity,
    multiplyWithCurrentTransform,
    position,
    prevPosition,
    prevRotate,
    prevScale,
    rotate,
    scale,
    transformManager,
    transformToUnitCube,
  ])

  // Shared values are applied on the Filament runtime whenever they change (scale -> rotate -> translate,
  // which is also the order the initial values get applied in). The last applied value is remembered per
  // prop, so a re-run of the effects (strict mode, fast refresh) doesn't apply the same transform twice.
  const prevScaleShared = useMemo(() => createSynchronizable<Float3 | null>(null), [])
  const prevRotateShared = useMemo(() => createSynchronizable<Float3 | null>(null), [])
  const prevPositionShared = useMemo(() => createSynchronizable<Float3 | null>(null), [])

  useSharedValueListener(isWorkletSharedValue(scale) ? scale : undefined, (newScale: Float3) => {
    'worklet'
    if (entity == null) return
    const previous = prevScaleShared.getBlocking()
    if (previous != null && areFloat3Equal(newScale, previous)) return

    transformManager.setEntityScale(entity, [newScale[0], newScale[1], newScale[2]], multiplyWithCurrentTransform)
    prevScaleShared.setBlocking([newScale[0], newScale[1], newScale[2]])
  })

  useSharedValueListener(isWorkletSharedValue(rotate) ? rotate : undefined, (newRotate: Float3) => {
    'worklet'
    if (entity == null) return
    const previous = prevRotateShared.getBlocking()
    if (previous != null && areFloat3Equal(newRotate, previous)) return

    const [x, y, z] = newRotate
    transformManager.setEntityRotation(entity, x, [1, 0, 0], multiplyWithCurrentTransform)
    // Rotation across axis is one operation so we need to always multiply the remaining rotations:
    transformManager.setEntityRotation(entity, y, [0, 1, 0], true)
    transformManager.setEntityRotation(entity, z, [0, 0, 1], true)
    prevRotateShared.setBlocking([x, y, z])
  })

  useSharedValueListener(isWorkletSharedValue(position) ? position : undefined, (newPosition: Float3) => {
    'worklet'
    if (entity == null) return
    const previous = prevPositionShared.getBlocking()
    if (previous != null && areFloat3Equal(newPosition, previous)) return

    transformManager.setEntityPosition(entity, [newPosition[0], newPosition[1], newPosition[2]], multiplyWithCurrentTransform)
    prevPositionShared.setBlocking([newPosition[0], newPosition[1], newPosition[2]])
  })
}
