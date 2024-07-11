import { useEffect, useRef } from 'react'
import { Rotation, TransformationProps } from '../../react/TransformContext'
import { useFilamentContext } from '../../react/Context'
import { AABB, Entity, Float3 } from '../../types'
import { areFloat3Equal, isWorkletSharedValue } from '../../utilities/helper'
import { useWorkletEffect } from '../useWorkletEffect'

type Params = {
  // If null it will not take the entity from the context, as it indicates that it will be provided through the param
  to: Entity | null
  transformProps?: TransformationProps
  // If transformToUnitCube is true, the aabb is required
  aabb?: AABB
}

/**
 * Takes the next entity from the context and applies all transformations from the next
 * transformation context to it
 */
export function useApplyTransformations({ to: entity, transformProps, aabb }: Params) {
  // const transformPropsFromContext = useContext(TransformContext)

  // const mergedTransformationProps = useMergeTransformationProps(transformProps, transformPropsFromContext)
  const { position, scale, rotate, transformToUnitCube, multiplyWithCurrentTransform = true } = transformProps ?? {}

  const { transformManager } = useFilamentContext()
  // TODO: multiplying current transformations is a bit problematic with react.
  // E.g. in strict mode or concurrent rendering our effects can be called multiple times.
  // Running an effect multiple times with transformation multiplication can lead to unexpected results.
  const prevScale = useRef<Float3 | null>(null)
  const prevRotate = useRef<Rotation>()
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

    if (
      rotate != null &&
      !isWorkletSharedValue(rotate) &&
      (rotate.angleInRadians !== prevRotate.current?.angleInRadians || !areFloat3Equal(rotate.axis, prevRotate.current?.axis))
    ) {
      transformManager.setEntityRotation(entity, rotate.angleInRadians, rotate.axis, multiplyWithCurrentTransform)
      prevRotate.current = rotate
    }

    if (Array.isArray(position) && (prevPosition.current == null || !areFloat3Equal(position, prevPosition.current))) {
      console.log('setEntityPosition', entity, position, multiplyWithCurrentTransform)
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
      const axis: Float3 = [rotate.value.axis['0'], rotate.value.axis['1'], rotate.value.axis['2']]
      transformManager.setEntityRotation(entity, rotate.value.angleInRadians, axis, multiplyWithCurrentTransform)
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

  // return mergedTransformationProps
}
