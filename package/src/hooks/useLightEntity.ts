import { useMemo } from 'react'
import { LightConfig, LightManager } from '../types'

/**
 * Creates a new memoized light entity based on the given configuration.
 */
export function useLightEntity(lightManager: LightManager, config: LightConfig) {
  const spotLightConfig = config.type === 'spot' || config.type === 'point' || config.type === 'focused_point' ? config : undefined
  return useMemo(() => {
    return lightManager.createLightEntity(
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
    lightManager,
    spotLightConfig?.falloffRadius,
    spotLightConfig?.spotLightCone,
  ])
}
