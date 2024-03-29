import { useMemo } from 'react'
import { Camera, Engine } from '../types'

export function useCamera(engine: Engine): Camera {
  return useMemo(() => engine.getCamera(), [engine])
}
