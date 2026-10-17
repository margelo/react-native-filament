import { useMemo } from 'react'
import { SphereShape } from '../types/Shapes'
import { BulletAPI } from '../bulletApi'

export function useSphereShape(radius: number): SphereShape {
  return useMemo(() => BulletAPI.createSphereShape(radius), [radius])
}
