import { useMemo } from 'react'
import { Box } from '../types/Shapes'
import { BulletAPI } from '../bulletApi'

export function useBoxShape(halfX: number, halfY: number, halfZ: number): Box {
  return useMemo(() => BulletAPI.createBoxShape(halfX, halfY, halfZ), [halfX, halfY, halfZ])
}
