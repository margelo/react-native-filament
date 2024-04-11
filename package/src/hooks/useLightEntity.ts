import { useMemo } from 'react'
import { Engine, LightConfig } from '../types'

/**
 * Creates a new memoized light entity based on the given configuration.
 */
export function useLightEntity(engine: Engine, config: LightConfig) {
  const spotLightConfig = config.type === 'spot' || config.type === 'point' || config.type === 'focused_point' ? config : undefined
  return useMemo(() => {
    return engine.createLightEntity(
      config.type,
      config.colorKelvin,
      config.intensity,
      config.direction,
      config.position,
      config.castShadows,
      spotLightConfig?.falloffRadius,
      spotLightConfig?.spotLightCone
    )
  }, [
    config.castShadows,
    config.colorKelvin,
    config.direction,
    config.intensity,
    config.position,
    config.type,
    engine,
    spotLightConfig?.falloffRadius,
    spotLightConfig?.spotLightCone,
  ])
}
