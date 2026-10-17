import { useMemo } from 'react'
import { BulletAPI } from '../bulletApi'

export function useWorld(x: number, y: number, z: number) {
  return useMemo(() => BulletAPI.createDiscreteDynamicWorld(x, y, z), [x, y, z])
}
