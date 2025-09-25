import { useMemo } from 'react'
import { LightConfig, LightManager } from '../types'
import { ISharedValue } from 'react-native-worklets-core'
import { useFilamentContext } from './useFilamentContext'
import { useWorkletEffect } from './useWorkletEffect'
import convertKelvinToLinearSRGB from '../utilities/convertKelvinToLinearSRGB'

export type UseLightEntityProps =
  | LightConfig
  | (Omit<LightConfig, 'intensity' | 'colorKelvin'> & {
      intensity?: number | ISharedValue<number>
      colorKelvin?: number | ISharedValue<number>
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
  const { workletContext } = useFilamentContext()
  useWorkletEffect(() => {
    'worklet'
    const intensity = config.intensity
    if (intensity == null) return
    if (typeof intensity === 'number') return

    const setIntensity = lightManager.setIntensity

    return intensity.addListener(
      workletContext.createRunAsync(() => {
        'worklet'
        setIntensity(entity, intensity.value)
      })
    )
  })

  // Subscribe to the colorKelvin shared value
  useWorkletEffect(() => {
    'worklet'
    const colorKelvin = config.colorKelvin
    if (colorKelvin == null) return
    if (typeof colorKelvin === 'number') return

    const setColor = lightManager.setColor

    return colorKelvin.addListener(
      workletContext.createRunAsync(() => {
        'worklet'
        setColor(entity, convertKelvinToLinearSRGB(colorKelvin.value))
      })
    )
  })

  return entity
}
