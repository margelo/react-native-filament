import { useEffect, useMemo } from 'react'
import { LightConfig, LightManager } from '../types'
import { ISharedValue } from 'react-native-worklets-core'
import { runOnWorklet } from '../utilities/runOnWorklet'

/**
 * Creates a new memoized light entity based on the given configuration.
 */
export function useLightEntity(
  lightManager: LightManager,
  config:
    | LightConfig
    | (Omit<LightConfig, 'intensity'> & {
        intensity?: ISharedValue<number>
      })
) {
  const falloffRadius = 'falloffRadius' in config ? config.falloffRadius : undefined
  const spotLightCone = 'spotLightCone' in config ? config.spotLightCone : undefined

  const entity = useMemo(() => {
    return lightManager.createLightEntity(
      config.type,
      config.colorKelvin,
      typeof config.intensity === 'number' ? config.intensity : config.intensity?.value,
      config.direction,
      config.position,
      config.castShadows,
      falloffRadius,
      spotLightCone
    )
  }, [
    config.castShadows,
    config.colorKelvin,
    config.direction,
    config.intensity,
    config.position,
    config.type,
    falloffRadius,
    lightManager,
    spotLightCone,
  ])

  // Eventually subscribe to the intensity shared value
  useEffect(() => {
    const intensity = config.intensity
    if (intensity == null) return
    if (typeof intensity === 'number') return

    const setIntensity = lightManager.setIntensity

    return intensity.addListener(
      runOnWorklet(() => {
        'worklet'
        setIntensity(entity, intensity.value)
      })
    )
  }, [config.intensity, entity, lightManager.setIntensity])

  return entity
}
