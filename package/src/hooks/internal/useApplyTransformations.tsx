import { useEffect, useMemo, useRef } from 'react'
import { TransformationProps } from '../../types/TransformProps'
import { useFilamentContext } from '../useFilamentContext'
import { AABB, Entity, Float3 } from '../../types'
import { areFloat3Equal, isWorkletSharedValue } from '../../utilities/helper'
import { useWorkletEffect } from '../useWorkletEffect'
import { BoxedHybridObject } from 'react-native-nitro-modules/lib/BoxedHybridObject'

type Params = {
  // If null it will not take the entity from the context, as it indicates that it will be provided through the param
  to?: BoxedHybridObject<Entity> | null
  transformProps?: TransformationProps
  // If transformToUnitCube is true, the aabb is required
  aabb?: BoxedHybridObject<AABB>
}

/**
 * Takes the next entity from the context and applies all transformations from the next
 * transformation context to it
 */
export function useApplyTransformations({ to: boxedEntity, transformProps, aabb: boxedAABB }: Params) {
  const { translate: position, scale, rotate, transformToUnitCube, multiplyWithCurrentTransform = true } = transformProps ?? {}

  const { transformManager } = useFilamentContext()
  const unboxedTransformManagerJS = useMemo(() => transformManager.unbox(), [transformManager])
  // TODO: multiplying current transformations is a bit problematic with react.
  // E.g. in strict mode or concurrent rendering our effects can be called multiple times.
  // Running an effect multiple times with transformation multiplication can lead to unexpected results.
  const prevScale = useRef<Float3 | null>(null)
  const prevRotate = useRef<Float3 | null>(null)
  const prevPosition = useRef<Float3 | null>(null)

  useEffect(() => {
    if (boxedEntity == null) return
    const entity = boxedEntity.unbox()
    const aabb = boxedAABB?.unbox()

    if (transformToUnitCube && aabb != null) {
      unboxedTransformManagerJS.transformToUnitCube(entity, aabb)
      console.log('converted to unit cube :)')
    }

    if (Array.isArray(scale) && (prevScale.current == null || !areFloat3Equal(scale, prevScale.current))) {
      unboxedTransformManagerJS.setEntityScale(entity, scale, multiplyWithCurrentTransform)
      prevScale.current = scale
    }

    if (Array.isArray(rotate) && (prevRotate.current == null || !areFloat3Equal(rotate, prevRotate.current))) {
      const [x, y, z] = rotate
      unboxedTransformManagerJS.setEntityRotation(entity, x, [1, 0, 0], multiplyWithCurrentTransform)
      // Rotation across axis is one operation so we need to always multiply the remaining rotations:
      unboxedTransformManagerJS.setEntityRotation(entity, y, [0, 1, 0], true)
      unboxedTransformManagerJS.setEntityRotation(entity, z, [0, 0, 1], true)
      prevRotate.current = rotate
    }

    if (Array.isArray(position) && (prevPosition.current == null || !areFloat3Equal(position, prevPosition.current))) {
      unboxedTransformManagerJS.setEntityPosition(entity, position, multiplyWithCurrentTransform)
      prevPosition.current = position
    }
  }, [
    boxedAABB,
    boxedEntity,
    multiplyWithCurrentTransform,
    position,
    prevPosition,
    prevRotate,
    prevScale,
    rotate,
    scale,
    unboxedTransformManagerJS,
    transformToUnitCube,
  ])

  console.log(transformProps)

  // Effects for when a transform option is a shared value (SRT)
  useEffect(() => {
    if (boxedEntity == null) return

    if (scale == null || Array.isArray(scale)) return

    const unsubscribeScale = scale.addListener(() => {
      'worklet'
      transformManager.unbox().setEntityScale(boxedEntity.unbox(), scale.value, multiplyWithCurrentTransform)
    })

    return () => {
      unsubscribeScale()
    }
  }, [boxedEntity, multiplyWithCurrentTransform, scale, transformManager])

  useWorkletEffect(() => {
    'worklet'
    if (boxedEntity == null) return

    if (rotate == null || !isWorkletSharedValue(rotate)) {
      return
    }

    const unsubscribeRotate = rotate.addListener(() => {
      'worklet'
      const entity = boxedEntity.unbox()
      const [x, y, z] = rotate.value
      const unboxedTransformManager = transformManager.unbox()
      unboxedTransformManager.setEntityRotation(entity, x, [1, 0, 0], multiplyWithCurrentTransform)
      // Rotation across axis is one operation so we need to always multiply the remaining rotations:
      unboxedTransformManager.setEntityRotation(entity, y, [0, 1, 0], true)
      unboxedTransformManager.setEntityRotation(entity, z, [0, 0, 1], true)
    })

    return () => {
      'worklet'
      unsubscribeRotate()
    }
  })

  useEffect(() => {
    if (boxedEntity == null) return

    if (position == null || Array.isArray(position)) return

    const unsubscribePosition = position.addListener(() => {
      'worklet'
      transformManager.unbox().setEntityPosition(boxedEntity.unbox(), position.value, multiplyWithCurrentTransform)
    })

    return () => {
      unsubscribePosition()
    }
  }, [boxedEntity, multiplyWithCurrentTransform, position, transformManager])
}
