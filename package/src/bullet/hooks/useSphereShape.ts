import { useMemo } from 'react'
import { Sphere } from '../types/Shapes'
import { BulletAPI } from '../bulletApi'

export function useSphereShape(radius: number): Sphere {
  return useMemo(() => BulletAPI.createSphereShape(radius), [radius])
}
