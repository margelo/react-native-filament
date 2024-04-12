import { useMemo } from 'react'
import { Engine } from '../types'

export function useLightManager(engine: Engine) {
  const lightManager = useMemo(() => engine.createLightManager(), [engine])
  return lightManager
}
