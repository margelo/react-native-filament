import { useMemo } from 'react'
import { StaticPlaneShape } from '../types/Shapes'
import { BulletAPI } from '../bulletApi'

export function useStaticPlaneShape(normalX: number, normalY: number, normalZ: number, constant: number): StaticPlaneShape {
  return useMemo(() => BulletAPI.createStaticPlaneShape(normalX, normalY, normalZ, constant), [normalX, normalY, normalZ, constant])
}
