import { useContext, useMemo } from 'react'
import { useFilamentContext } from '../hooks/useFilamentContext'
import { Float3 } from '../types'
import { TransformationProps } from '../types/TransformProps'
import { useApplyTransformations } from '../hooks/internal/useApplyTransformations'
import { ParentInstancesContext } from './ParentInstancesContext'
import { useEntityInScene } from '../hooks/useEntityInScene'

export type DebugBoxProps = TransformationProps & {
  halfExtent?: Float3
}

export function DebugBox({ halfExtent: halfExtentProp, ...transformProps }: DebugBoxProps) {
  const instances = useContext(ParentInstancesContext)
  const parentInstance = instances?.[0]
  const parentHalfExtend = useMemo(() => {
    if (parentInstance == null) return undefined
    return parentInstance.getBoundingBox().halfExtent
  }, [parentInstance])

  const halfExtent = halfExtentProp ?? parentHalfExtend

  const { renderableManager, scene } = useFilamentContext()
  const boxEntity = useMemo(() => {
    if (halfExtent == null) return null

    // TODO: other colors are only supported by importing a material - i think it should be possible to create a material on the fly
    return renderableManager.createDebugCubeWireframe(halfExtent, undefined, undefined)
  }, [halfExtent, renderableManager])

  useApplyTransformations({ to: boxEntity, transformProps })

  useEntityInScene(scene, boxEntity ?? undefined)

  return null
}
