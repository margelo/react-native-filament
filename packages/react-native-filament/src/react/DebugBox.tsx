import { useContext } from 'react'
import { useDisposableResource } from '../hooks/useDisposableResource'
import { useEntityInScene } from '../hooks/useEntityInScene'
import type { Float3 } from '../specs/types/Float3'
import type { Float4 } from '../specs/types/Float4'
import { ModelContext } from './ModelContext'
import type { TransformationProps } from './TransformationProps'
import { useFilamentScene } from './useFilamentScene'
import { useRenderCommit } from './useRenderCommit'
import { useTransformProps } from './useTransformProps'

export interface DebugBoxProps extends Omit<TransformationProps, 'transformToUnitCube'> {
  /** @default the bounding box of the parent `Model`, which the box then follows */
  halfExtent?: Float3
  /** @default the bounding box center of the parent `Model` */
  center?: Float3
  /** Linear RGBA color of the edges. @default [0, 1, 0, 1] */
  color?: Float4
}

/** Wireframe edges of a box, by default around the parent `Model`. */
export function DebugBox({ halfExtent, center, color, ...transformProps }: DebugBoxProps) {
  const { engine, scene, transformManager } = useFilamentScene()
  const commit = useRenderCommit()
  const parent = useContext(ModelContext)
  const bounds = parent?.model.boundingBox
  const resolvedHalfExtent = halfExtent ?? bounds?.halfExtent
  if (resolvedHalfExtent == null) {
    throw new Error('<DebugBox> needs a halfExtent outside of a <Model>.')
  }
  const resolvedCenter = center ?? bounds?.center
  const parentEntity = parent?.rootEntity
  const shapeKey = JSON.stringify([resolvedHalfExtent, resolvedCenter, color])

  const box = useDisposableResource(() => {
    const options = { halfExtent: resolvedHalfExtent, center: resolvedCenter, color }
    return commit.run(() => {
      'worklet'
      const created = engine.createDebugBox(options)
      if (parentEntity != null) transformManager.setParent(created.entity, parentEntity)
      return created
    })
  }, [engine, commit, shapeKey, parentEntity])
  useEntityInScene(scene, box?.entity)
  useTransformProps(box?.entity, transformProps)
  return null
}
