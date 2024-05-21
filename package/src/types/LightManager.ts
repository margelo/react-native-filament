import { Entity } from './Entity'
import { LightConfig, LightType, SpotLightExtraConfig } from './LightConfig'
import { PointerHolder } from './PointerHolder'
import { Float3 } from './Math'

/**
 * LightManager allows to create a light source in the scene, such as a sun or street lights.
 *
 * At least one light must be added to a scene in order to see anything
 * (unless the Material.Shading.UNLIT is used).
 */
export interface LightManager extends PointerHolder {
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

  /**
   * Destroys this component from the given entity, should only be called when removed from the scene
   */
  destroy(entityWrapper: Entity): void
  /**
   * Dynamically updates the light's position.
   *
   * @param position Light's position in world space. The default is at the origin.
   */
  setPosition(entityWrapper: Entity, position: Float3[]): void
  /**
   * Returns the light's position in world space.
   */
  getPosition(entityWrapper: Entity): Float3[]
  /**
   * Dynamically updates the light's direction
   *
   * @param direction Light's direction in world space. Should be a unit vector.
   *                  The default is {0,-1,0}.
   */
  setDirection(entityWrapper: Entity, direction: Float3[]): void
  /**
   * Returns the light's direction in world space.
   */
  getDirection(entityWrapper: Entity): Float3[]
  /**
   * Dynamically updates the light's hue as linear sRGB
   *
   * @param color Color of the light specified in the linear sRGB color-space.
   *              The default is white {1,1,1}.
   */
  setColor(entityWrapper: Entity, linearSRGBColor: Float3[]): void
  /**
   * Returns the light's color in linear sRGB color-space.
   */
  getColor(entityWrapper: Entity): Float3[]
  /**
   * Dynamically updates the light's intensity. The intensity can be negative.
   *
   * @param intensity This parameter depends on the Light.Type:
   *                  - For directional lights, it specifies the illuminance in *lux*
   *                  (or *lumen/m^2*).
   *                  - For point lights and spot lights, it specifies the luminous power
   *                  in *lumen*.
   */
  setIntensity(entityWrapper: Entity, intensity: number): void
  /**
   * returns the light's luminous intensity in candela.
   *
   * @note for Type.FOCUSED_SPOT lights, the returned value depends on the \p outer cone angle.
   *
   * @return luminous intensity in candela.
   */
  getIntensity(entityWrapper: Entity): number
  /**
   * Set the falloff distance for point lights and spot lights.
   *
   * @param radius falloff distance in world units. Default is 1 meter.
   */
  setFalloff(entityWrapper: Entity, falloffRadius: number): void
  /**
   * @return the falloff distance of this light.
   */
  getFalloff(entityWrapper: Entity): number
  /**
   * Dynamically updates a spot light's cone as angles
   *
   * @param inner inner cone angle in *radians* between 0.00873 and outer
   * @param outer outer cone angle in *radians* between 0.00873 and pi/2
   */
  setSpotLightCone(entityWrapper: Entity, spotLightCone: [innerRadians: number, outerRadians: number]): void
  getSpotLightCone(entityWrapper: Entity): Float3[]
}
