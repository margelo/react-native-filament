import { useMemo, useEffect } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import { LightConfig, LightManager } from '../types'
import { useSharedValueListener } from './useSharedValueListener'
import convertKelvinToLinearSRGB from '../utilities/convertKelvinToLinearSRGB'

export type UseLightEntityProps =
  | LightConfig
  | (Omit<LightConfig, 'intensity' | 'colorKelvin'> & {
      intensity?: number | SharedValue<number>
      colorKelvin?: number | SharedValue<number>
    })

/**
 * Creates a new memoized light entity based on the given configuration.
 */
export function useLightEntity(lightManager: LightManager, config: UseLightEntityProps) {
  const falloffRadius = 'falloffRadius' in config ? config.falloffRadius : undefined
  const spotLightCone = 'spotLightCone' in config ? config.spotLightCone : undefined

  // Unwrap all array-ish values so the user doesn't have to memo them!
  const directionX = config.direction?.[0] ?? undefined
  const directionY = config.direction?.[1] ?? undefined
  const directionZ = config.direction?.[2] ?? undefined

  const positionX = config.position?.[0] ?? undefined
  const positionY = config.position?.[1] ?? undefined
  const positionZ = config.position?.[2] ?? undefined

  const innerSpotLightCone = spotLightCone?.[0] ?? undefined
  const outerSpotLightCone = spotLightCone?.[1] ?? undefined

  const entity = useMemo(() => {
    return lightManager.createLightEntity(
      config.type,
      typeof config.colorKelvin === 'number' ? config.colorKelvin : config.colorKelvin?.value,
      typeof config.intensity === 'number' ? config.intensity : config.intensity?.value,
      directionX != null && directionY != null && directionZ != null ? [directionX, directionY, directionZ] : undefined,
      positionX != null && positionY != null && positionZ != null ? [positionX, positionY, positionZ] : undefined,
      config.castShadows,
      falloffRadius,
      innerSpotLightCone != null && outerSpotLightCone != null ? [innerSpotLightCone, outerSpotLightCone] : undefined
    )
  }, [
    config.castShadows,
    config.colorKelvin,
    config.intensity,
    config.type,
    directionX,
    directionY,
    directionZ,
    falloffRadius,
    innerSpotLightCone,
    lightManager,
    outerSpotLightCone,
    positionX,
    positionY,
    positionZ,
  ])

  useEffect(() => {
    return () => lightManager.destroy(entity)
  }, [entity, lightManager])

  // Subscribe to the intensity shared value
  useSharedValueListener(typeof config.intensity === 'number' ? undefined : config.intensity, (intensity: number) => {
    'worklet'
    lightManager.setIntensity(entity, intensity)
  })

  // Subscribe to the colorKelvin shared value
  useSharedValueListener(typeof config.colorKelvin === 'number' ? undefined : config.colorKelvin, (colorKelvin: number) => {
    'worklet'
    lightManager.setColor(entity, convertKelvinToLinearSRGB(colorKelvin))
  })

  return entity
}
