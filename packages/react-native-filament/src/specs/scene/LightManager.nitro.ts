import type { HybridObject } from 'react-native-nitro-modules'
import type { Entity } from '../types/Entity'
import type { Float2 } from '../types/Float2'
import type { Float3 } from '../types/Float3'
import type { LightType } from '../types/LightType'

/**
 * Reads and writes the light components of entities, including lights loaded with a model. Every
 * method runs on the render thread and throws `FilamentInvalidEntityError` for an entity without a
 * light component in this Engine. `setIntensity` takes lux for directional and sun lights and lumens
 * for point and spot lights; `getIntensity` returns lux for directional and sun lights but candela for
 * point and spot lights.
 */
export interface LightManager extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  getType(entity: Entity): LightType
  getIntensity(entity: Entity): number
  setIntensity(entity: Entity, intensity: number): void
  /** Linear RGB. */
  getColor(entity: Entity): Float3
  /** Linear RGB. */
  setColor(entity: Entity, color: Float3): void
  getPosition(entity: Entity): Float3
  setPosition(entity: Entity, position: Float3): void
  getDirection(entity: Entity): Float3
  setDirection(entity: Entity, direction: Float3): void
  getFalloff(entity: Entity): number
  setFalloff(entity: Entity, radius: number): void
  /** `[inner, outer]` cone angles in radians. */
  getSpotLightCone(entity: Entity): Float2
  setSpotLightCone(entity: Entity, innerRadians: number, outerRadians: number): void
  isShadowCaster(entity: Entity): boolean
  setShadowCaster(entity: Entity, castShadows: boolean): void
}
