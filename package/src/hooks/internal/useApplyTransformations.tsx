import { useContext, useEffect, useRef } from 'react'
import { TransformationProps, TransformContext } from '../../react/TransformContext'
import { useFilamentContext } from '../../react/Context'
import { AABB, Entity, Float3 } from '../../types'
import { areFloat3Equal } from '../../utilities/helper'
import { useMergeTransformationProps } from './useMergeTransformationProps'

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
export function useApplyTransformations({ to: entity, transformProps, aabb }: Params): TransformationProps {
  const transformPropsFromContext = useContext(TransformContext)

  const mergedTransformationProps = useMergeTransformationProps(transformProps, transformPropsFromContext)
  const { position, scale, rotate, transformToUnitCube, multiplyWithCurrentTransform = true } = mergedTransformationProps

  const { transformManager } = useFilamentContext()
  // TODO: multiplying current transformations is a bit problematic with react.
  // E.g. in strict mode or concurrent rendering our effects can be called multiple times.
  // Running an effect multiple times with transformation multiplication can lead to unexpected results.
  const prevScale = useRef<Float3 | null>(null)
  const prevRotate = useRef<typeof rotate>()
  const prevPosition = useRef<Float3 | null>(null)

  useEffect(() => {
    if (entity == null) return

    if (transformToUnitCube && aabb != null) {
      transformManager.transformToUnitCube(entity, aabb)
    }

    if (scale != null && (prevScale.current == null || !areFloat3Equal(scale, prevScale.current))) {
      transformManager.setEntityScale(entity, scale, multiplyWithCurrentTransform)
      prevScale.current = scale
    }

    if (
      rotate != null &&
      (rotate.angleInRadians !== prevRotate.current?.angleInRadians || !areFloat3Equal(rotate.axis, prevRotate.current?.axis))
    ) {
      transformManager.setEntityRotation(entity, rotate.angleInRadians, rotate.axis, multiplyWithCurrentTransform)
      prevRotate.current = rotate
    }

    if (position != null && (prevPosition.current == null || !areFloat3Equal(position, prevPosition.current))) {
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

  return mergedTransformationProps
}
