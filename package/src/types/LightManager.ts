import { Entity } from './Entity'
import { LightConfig, LightType, SpotLightExtraConfig } from './LightConfig'

/**
 * LightManager allows to create a light source in the scene, such as a sun or street lights.
 *
 * At least one light must be added to a scene in order to see anything
 * (unless the Material.Shading.UNLIT is used).
 */
export interface LightManager {
  createLightEntity(
    type: LightType,
    colorKelvin: LightConfig['colorKelvin'],
    intensity: LightConfig['intensity'],
    direction: LightConfig['direction'],
    position: LightConfig['position'],
    castShadows: LightConfig['castShadows'],
    falloffRadius: SpotLightExtraConfig['falloffRadius'],
    spotLightCone: SpotLightExtraConfig['spotLightCone']
  ): Entity
}
