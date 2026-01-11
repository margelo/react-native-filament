import { useMemo } from 'react'
import { LightConfig, LightManager } from '../types'
import { useWorkletEffect } from './useWorkletEffect'
import convertKelvinToLinearSRGB from '../utilities/convertKelvinToLinearSRGB'
import { type SharedValue } from 'react-native-reanimated'

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

  // Subscribe to the intensity shared value
  useWorkletEffect(() => {
    'worklet'
    const intensity = config.intensity
    if (intensity == null) return
    if (typeof intensity === 'number') return

    const setIntensity = lightManager.setIntensity

    const randomNumericId = Number(Math.random().toString().substring(12))
    intensity.addListener(
      randomNumericId,
      // TODO: do we need to wrap this in createRunAsync?
      () => {
        'worklet'
        setIntensity(entity, intensity.value)
      }
    )

    // TODO: i believe this is causing crashes rn
    // return () => {
    //   'worklet'
    //   intensity.removeListener(randomNumericId)
    // }
  })

  // Subscribe to the colorKelvin shared value
  useWorkletEffect(() => {
    'worklet'
    const colorKelvin = config.colorKelvin
    if (colorKelvin == null) return
    if (typeof colorKelvin === 'number') return

    const setColor = lightManager.setColor

    const randomNumericId = Number(Math.random().toString().substring(12))
    colorKelvin.addListener(randomNumericId, () => {
      'worklet'
      setColor(entity, convertKelvinToLinearSRGB(colorKelvin.value))
    })

    // TODO: i believe this is causing crashes rn
    // return () => {
    //   'worklet'
    //   colorKelvin.removeListener(randomNumericId)
    // }
  })

  return entity
}
