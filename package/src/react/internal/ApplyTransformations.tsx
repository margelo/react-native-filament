import { useContext, useEffect } from 'react'
import { useParentEntityContext } from '../ParentEntityContex'
import { TransformContext } from '../TransformContext'
import { useFilamentContext } from '../Context'

/**
 * Takes the next entity from the context and applies all transformations from the next
 * transformation context to it
 */
export function ApplyTransformations() {
  const entity = useParentEntityContext()
  const { position, multiplyWithCurrentTransform = false } = useContext(TransformContext) ?? {}

  const { transformManager } = useFilamentContext()
  useEffect(() => {
    if (position != null) {
      transformManager.setEntityPosition(entity, position, multiplyWithCurrentTransform)
    }
  }, [entity, multiplyWithCurrentTransform, position, transformManager])

  return null
}
