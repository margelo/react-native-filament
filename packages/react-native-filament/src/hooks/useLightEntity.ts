import { isListenableValue } from '../bindings/isListenableValue'
import type { ListenableValue } from '../bindings/ListenableValue'
import { kelvinToLinearRgb } from '../math/kelvinToLinearRgb'
import { useFilamentScene } from '../react/useFilamentScene'
import { useLiveValue } from '../react/useLiveValue'
import { useRenderCommit } from '../react/useRenderCommit'
import type { Engine } from '../specs/engine/Engine.nitro'
import type { Light } from '../specs/scene/Light.nitro'
import type { Float3 } from '../specs/types/Float3'
import type { LightConfig } from './LightConfig'
import { useDisposableResource } from './useDisposableResource'

interface ResolvedLightConfig {
  type: LightConfig['type']
  colorKelvin?: number
  intensity?: number
  castShadows?: boolean
  direction?: Float3
  position?: Float3
  falloffRadius?: number
  spotLightCone?: [number, number]
  angularRadiusDegrees?: number
  haloSize?: number
  haloFalloff?: number
}

function current<T>(value: T | ListenableValue<T> | undefined): T | undefined {
  return value != null && isListenableValue(value) ? value.value : (value as T | undefined)
}

function createLight(engine: Engine, config: ResolvedLightConfig): Light {
  'worklet'
  const { colorKelvin, intensity, castShadows, direction, position, falloffRadius } = config
  switch (config.type) {
    case 'directional':
      return engine.createDirectionalLight({ colorKelvin, intensityLux: intensity, direction, castShadows })
    case 'sun':
      return engine.createSunLight({
        colorKelvin,
        intensityLux: intensity,
        direction,
        castShadows,
        angularRadiusDegrees: config.angularRadiusDegrees,
        haloSize: config.haloSize,
        haloFalloff: config.haloFalloff,
      })
    case 'point':
      return engine.createPointLight({ colorKelvin, intensityLumens: intensity, position, falloffRadius, castShadows })
    case 'spot':
    case 'focused-spot': {
      const options = {
        colorKelvin,
        intensityLumens: intensity,
        position,
        direction,
        falloffRadius,
        castShadows,
        innerConeRadians: config.spotLightCone?.[0],
        outerConeRadians: config.spotLightCone?.[1],
      }
      return config.type === 'spot' ? engine.createSpotLight(options) : engine.createFocusedSpotLight(options)
    }
  }
}

/**
 * Creates a light entity and disposes it on unmount. Color, intensity, direction and position follow
 * their props and SharedValues without recreating the light.
 */
export function useLightEntity(config: LightConfig): Light | undefined {
  const { engine, lightManager } = useFilamentScene()
  const commit = useRenderCommit()
  const { colorKelvin, intensity, ...structure } = config
  const direction = 'direction' in config ? config.direction : undefined
  const position = 'position' in config ? config.position : undefined
  const structureKey = JSON.stringify({ ...structure, direction: undefined, position: undefined })

  const light = useDisposableResource(() => {
    const resolved = {
      ...JSON.parse(structureKey),
      colorKelvin: current(colorKelvin),
      intensity: current(intensity),
      direction: current(direction),
      position: current(position),
    } as ResolvedLightConfig
    return commit.run(() => {
      'worklet'
      return createLight(engine, resolved)
    })
  }, [engine, commit, structureKey])

  const entity = light?.entity
  useLiveValue(
    entity == null ? undefined : intensity,
    (value) => {
      'worklet'
      lightManager.setIntensity(entity!, value)
    },
    [entity]
  )
  useLiveValue(
    entity == null ? undefined : colorKelvin,
    (kelvin) => {
      'worklet'
      lightManager.setColor(entity!, kelvinToLinearRgb(kelvin))
    },
    [entity]
  )
  useLiveValue(
    entity == null ? undefined : direction,
    (value) => {
      'worklet'
      lightManager.setDirection(entity!, value as Float3)
    },
    [entity]
  )
  useLiveValue(
    entity == null ? undefined : position,
    (value) => {
      'worklet'
      lightManager.setPosition(entity!, value as Float3)
    },
    [entity]
  )
  return light
}
