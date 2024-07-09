import { useEffect } from 'react'
import { TransformationProps } from '../../react/TransformContext'
import { useFilamentContext } from '../../react/Context'
import { Entity } from '../../types'

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
  // TODO: should the default be to auto multiply with current transform on successive transformations?
  // E.g. this currently doesn't yield what a user would expect:
  // <Group position={[1, 0, 0]}><Model scale={[1, 2, 1]} /></Group>
  // This would only apply 1 of th operations, but not both
  const { position, scale, rotate, multiplyWithCurrentTransform = false } = transformProps ?? {}

  const { transformManager } = useFilamentContext()
  useEffect(() => {
    if (entity == null) return

    if (position != null) {
      transformManager.setEntityPosition(entity, position, multiplyWithCurrentTransform)
    }

    if (scale != null) {
      transformManager.setEntityScale(entity, scale, multiplyWithCurrentTransform)
    }

    if (rotate != null) {
      transformManager.setEntityRotation(entity, rotate.angleInRadians, rotate.axis, multiplyWithCurrentTransform)
    }
  }, [entity, multiplyWithCurrentTransform, position, rotate, scale, transformManager])
}
