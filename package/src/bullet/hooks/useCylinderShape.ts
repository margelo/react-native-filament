import { useMemo } from 'react'
import { CylinderShape } from '../types/Shapes.nitro'
import { BulletAPI } from '../bulletApi'
import { Float3 } from '../../types'

type CylinderShapeProps = {
  half: Float3
  localScaling?: Float3
}

export function useCylinderShape(props: CylinderShapeProps | undefined): CylinderShape | undefined {
  const { half, localScaling } = props ?? {}
  const scaleX = localScaling?.[0]
  const scaleY = localScaling?.[1]
  const scaleZ = localScaling?.[2]
  const halfX = half?.[0]
  const halfY = half?.[1]
  const halfZ = half?.[2]

  return useMemo(() => {
    if (halfX == null || halfY == null || halfZ == null) {
      return undefined
    }

    const shape = BulletAPI.createCylinderShape(halfX, halfY, halfZ)
    if (scaleX != null && scaleY != null && scaleZ != null) {
      shape.localScaling = [scaleX, scaleY, scaleZ]
    }
    return shape
  }, [halfX, halfY, halfZ, scaleX, scaleY, scaleZ])
}
