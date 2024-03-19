import { useMemo } from 'react'
import { StaticPlane } from '../types/Shapes'
import { BulletAPI } from '../bulletApi'

export function useStaticPlaneShape(normalX: number, normalY: number, normalZ: number, constant: number): StaticPlane {
  return useMemo(() => BulletAPI.createStaticPlaneShape(normalX, normalY, normalZ, constant), [normalX, normalY, normalZ, constant])
}
