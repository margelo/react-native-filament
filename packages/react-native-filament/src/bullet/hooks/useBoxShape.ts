import { useMemo } from 'react'
import { BoxShape } from '../types/Shapes'
import { BulletAPI } from '../bulletApi'

export function useBoxShape(halfX: number, halfY: number, halfZ: number): BoxShape {
  return useMemo(() => BulletAPI.createBoxShape(halfX, halfY, halfZ), [halfX, halfY, halfZ])
}
