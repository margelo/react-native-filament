import { useEffect, useRef } from 'react'
import { TransformationProps } from '../../react/TransformContext'
import { useFilamentContext } from '../useFilamentContext'
import { AABB, Entity, Float3 } from '../../types'
import { areFloat3Equal, isWorkletSharedValue } from '../../utilities/helper'
import { useWorkletEffect } from '../useWorkletEffect'

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

    if (Array.isArray(scale) && (prevScale.current == null || !areFloat3Equal(scale, prevScale.current))) {
      transformManager.setEntityScale(entity, scale, multiplyWithCurrentTransform)
      prevScale.current = scale
    }

    if (Array.isArray(rotate) && (prevRotate.current == null || !areFloat3Equal(rotate, prevRotate.current))) {
      const [x, y, z] = rotate
      transformManager.setEntityRotation(entity, x, [1, 0, 0], multiplyWithCurrentTransform)
      // Rotation across axis is one operation so we need to always multiply the remaining rotations:
      transformManager.setEntityRotation(entity, y, [0, 1, 0], true)
      transformManager.setEntityRotation(entity, z, [0, 0, 1], true)
      prevRotate.current = rotate
    }

    if (Array.isArray(position) && (prevPosition.current == null || !areFloat3Equal(position, prevPosition.current))) {
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

  // Effects for when a transform option is a shared value (SRT)
  useEffect(() => {
    if (entity == null) return

    if (scale == null || Array.isArray(scale)) return

    const unsubscribeScale = scale.addListener(() => {
      transformManager.setEntityScale(entity, scale.value, multiplyWithCurrentTransform)
    })

    return () => {
      unsubscribeScale()
    }
  }, [entity, multiplyWithCurrentTransform, scale, transformManager])

  useWorkletEffect(() => {
    'worklet'
    if (entity == null) return

    if (rotate == null || !isWorkletSharedValue(rotate)) {
      return
    }

    const unsubscribeRotate = rotate.addListener(() => {
      'worklet'
      const [x, y, z] = rotate.value
      transformManager.setEntityRotation(entity, x, [1, 0, 0], multiplyWithCurrentTransform)
      // Rotation across axis is one operation so we need to always multiply the remaining rotations:
      transformManager.setEntityRotation(entity, y, [0, 1, 0], true)
      transformManager.setEntityRotation(entity, z, [0, 0, 1], true)
    })

    return () => {
      'worklet'
      unsubscribeRotate()
    }
  })

  useEffect(() => {
    if (entity == null) return

    if (position == null || Array.isArray(position)) return

    const unsubscribePosition = position.addListener(() => {
      transformManager.setEntityPosition(entity, position.value, multiplyWithCurrentTransform)
    })

    return () => {
      unsubscribePosition()
    }
  }, [entity, multiplyWithCurrentTransform, position, transformManager])
}
