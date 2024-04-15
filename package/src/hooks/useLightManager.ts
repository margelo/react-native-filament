import { useEffect, useMemo } from 'react'
import { Engine } from '../types'

export function useLightManager(engine: Engine) {
  const lightManager = useMemo(() => engine.createLightManager(), [engine])

  useEffect(() => {
    return () => {
      lightManager.release()
    }
  }, [lightManager])

  return lightManager
}
