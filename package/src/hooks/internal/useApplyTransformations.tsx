import { useContext, useEffect, useMemo, useRef } from 'react'
import { TransformationProps, TransformContext } from '../../react/TransformContext'
import { useFilamentContext } from '../../react/Context'
import { Entity, Float3 } from '../../types'
import { areFloat3Equal } from '../../utilities/helper'

type Params = {
  // If null it will not take the entity from the context, as it indicates that it will be provided through the param
  to: Entity | null
  transformProps?: TransformationProps
}

/**
 * Takes the next entity from the context and applies all transformations from the next
 * transformation context to it
 */
export function useApplyTransformations({ to: entity, transformProps }: Params): void {
  const transformPropsFromContext = useContext(TransformContext)

  // TODO: useMergeTransformProps ?
  const rotateAngle = transformProps?.rotate?.angleInRadians ?? transformPropsFromContext?.rotate?.angleInRadians
  const rotateAxisX = transformProps?.rotate?.axis[0] ?? transformPropsFromContext?.rotate?.axis[0]
  const rotateAxisY = transformProps?.rotate?.axis[1] ?? transformPropsFromContext?.rotate?.axis[1]
  const rotateAxisZ = transformProps?.rotate?.axis[2] ?? transformPropsFromContext?.rotate?.axis[2]

  const positonX = transformProps?.position?.[0] ?? transformPropsFromContext?.position?.[0]
  const positonY = transformProps?.position?.[1] ?? transformPropsFromContext?.position?.[1]
  const positonZ = transformProps?.position?.[2] ?? transformPropsFromContext?.position?.[2]

  const scaleX = transformProps?.scale?.[0] ?? transformPropsFromContext?.scale?.[0]
  const scaleY = transformProps?.scale?.[1] ?? transformPropsFromContext?.scale?.[1]
  const scaleZ = transformProps?.scale?.[2] ?? transformPropsFromContext?.scale?.[2]

  const mergedTransformProps = useMemo((): TransformationProps => {
    return {
      position: positonX != null && positonY != null && positonZ != null ? [positonX, positonY, positonZ] : undefined,
      scale: scaleX != null && scaleY != null && scaleZ != null ? [scaleX, scaleY, scaleZ] : undefined,
      rotate:
        rotateAngle != null && rotateAxisX != null && rotateAxisY != null && rotateAxisZ != null
          ? {
              angleInRadians: rotateAngle,
              axis: [rotateAxisX, rotateAxisY, rotateAxisZ],
            }
          : undefined,
      multiplyWithCurrentTransform: transformProps?.multiplyWithCurrentTransform ?? transformPropsFromContext?.multiplyWithCurrentTransform,
      transformToUnitCube: transformProps?.transformToUnitCube ?? transformPropsFromContext?.transformToUnitCube,
    }
  }, [
    positonX,
    positonY,
    positonZ,
    rotateAngle,
    rotateAxisX,
    rotateAxisY,
    rotateAxisZ,
    scaleX,
    scaleY,
    scaleZ,
    transformProps?.multiplyWithCurrentTransform,
    transformProps?.transformToUnitCube,
    transformPropsFromContext?.multiplyWithCurrentTransform,
    transformPropsFromContext?.transformToUnitCube,
  ])

  const { position, scale, rotate, multiplyWithCurrentTransform = true } = mergedTransformProps

  const { transformManager } = useFilamentContext()
  // TODO: multiplying current transformations is a bit problematic with react.
  // E.g. in strict mode or concurrent rendering our effects can be called multiple times.
  // Running an effect multiple times with transformation multiplication can lead to unexpected results.
  const prevScale = useRef<Float3 | null>(null)
  const prevRotate = useRef<typeof rotate>()
  const prevPosition = useRef<Float3 | null>(null)

  console.log({ prevScale })
  useEffect(() => {
    if (entity == null) return

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
  }, [entity, multiplyWithCurrentTransform, position, prevPosition, prevRotate, prevScale, rotate, scale, transformManager])
}
