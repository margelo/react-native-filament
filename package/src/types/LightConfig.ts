import { Float3 } from './float3'

export type BaseLightConfig = {
  /**
   * Sets the initial color of a light.
   *
   * @param color Color of the light specified in the linear sRGB color-space.
   *              The default is white {1,1,1}.
   */
  colorKelvin?: number
  /**
   * Sets the initial intensity of a light.
   * @param intensity This parameter depends on the Light.Type:
   *                  - For directional lights, it specifies the illuminance in *lux*
   *                  (or *lumen/m^2*).
   *                  - For point lights and spot lights, it specifies the luminous power
   *                  in *lumen*.
   *
   * For example, the sun's illuminance is about 100,000 lux.
   *
   * This method overrides any prior calls to intensity or intensityCandela.
   *
   */
  intensity?: number
  /**
   * Sets the initial direction of a light in world space.
   *
   * @param direction Light's direction in world space. Should be a unit vector.
   *                  The default is {0,-1,0}.
   *
   * @note
   * The Light's direction is ignored for Type.POINT lights.
   */
  direction?: Float3
  /**
   * Sets the initial position of the light in world space.
   * The default is at the origin.
   *
   * @note
   * The Light's position is ignored for directional lights (Type.DIRECTIONAL or Type.SUN)
   */
  position?: Float3
  /**
   * Whether this Light casts shadows (disabled by default)
   */
  castShadows?: boolean
}

export type SpotLightExtraConfig = {
  /**
   *   - POINT,          //!< Point light, emits light from a position, in all directions.
   *   - FOCUSED_SPOT,   //!< Physically correct spot light.
   *   - SPOT,           //!< Spot light with coupling of outer cone and illumination disabled.
   */
  type: 'spot' | 'point' | 'focused_point'

  /**
   * Set the falloff distance for point lights and spot lights.
   * Falloff distance in world units.
   *
   * At the falloff distance, the light has no more effect on objects.
   *
   * The falloff distance essentially defines a *sphere of influence* around the light, and
   * therefore has an impact on performance. Larger falloffs might reduce performance
   * significantly, especially when many lights are used.
   *
   * Try to avoid having a large number of light's spheres of influence overlap.
   *
   * @default 1 meter
   *
   * @note
   * The Light's falloff is ignored for directional lights (Type.DIRECTIONAL or Type.SUN)
   */
  falloffRadius?: number

  /**
   * Defines a spot light'st angular falloff attenuation.
   *
   * A spot light is defined by a position, a direction and two cones, \p inner and \p outer.
   * These two cones are used to define the angular falloff attenuation of the spot light
   * and are defined by the angle from the center axis to where the falloff begins (i.e.
   * cones are defined by their half-angle).
   *
   * Both inner and outer are silently clamped to a minimum value of 0.5 degrees
   * (~0.00873 radians) to avoid floating-point precision issues during rendering.
   *
   * @param inner inner cone angle in *radians* between 0.00873 and \p outer
   * @param outer outer cone angle in *radians* between 0.00873 inner and @f$ \pi/2 @f$
   *
   * @note
   * The spot light cone is ignored for directional and point lights.
   *
   * @see Type.SPOT, Type.FOCUSED_SPOT
   */
  spotLightCone?: [innerRadians: number, outerRadians: number]
}

/**
 * Light types
 * ===========
 *
 * Lights come in three flavors:
 * - directional lights
 * - point lights
 * - spot lights
 *
 *
 * Directional lights
 * ------------------
 *
 * Directional lights have a direction, but don't have a position. All light rays are
 * parallel and come from infinitely far away and from everywhere. Typically a directional light
 * is used to simulate the sun.
 *
 * Directional lights and spot lights are able to cast shadows.
 *
 * To create a directional light use Type.DIRECTIONAL or Type.SUN, both are similar, but the later
 * also draws a sun's disk in the sky and its reflection on glossy objects.
 *
 * @warning Currently, only a single directional light is supported. If several directional lights
 * are added to the scene, the dominant one will be used.
 *
 * @see Builder.direction(), Builder.sunAngularRadius()
 *
 * Point lights
 * ------------
 *
 * Unlike directional lights, point lights have a position but emit light in all directions.
 * The intensity of the light diminishes with the inverse square of the distance to the light.
 * Builder.falloff() controls distance beyond which the light has no more influence.
 *
 * A scene can have multiple point lights.
 *
 * @see Builder.position(), Builder.falloff()
 *
 * Spot lights
 * -----------
 *
 * Spot lights are similar to point lights but the light it emits is limited to a cone defined by
 * Builder.spotLightCone() and the light's direction.
 *
 * A spot light is therefore defined by a position, a direction and inner and outer cones. The
 * spot light's influence is limited to inside the outer cone. The inner cone defines the light's
 * falloff attenuation.
 *
 * A physically correct spot light is a little difficult to use because changing the outer angle
 * of the cone changes the illumination levels, as the same amount of light is spread over a
 * changing volume. The coupling of illumination and the outer cone means that an artist cannot
 * tweak the influence cone of a spot light without also changing the perceived illumination.
 * It therefore makes sense to provide artists with a parameter to disable this coupling. This
 * is the difference between Type.FOCUSED_SPOT and Type.SPOT.
 *
 * @see Builder.position(), Builder.direction(), Builder.falloff(), Builder.spotLightCone()
 *
 * Performance considerations
 * ==========================
 *
 * Generally, adding lights to the scene hurts performance, however filament is designed to be
 * able to handle hundreds of lights in a scene under certain conditions. Here are some tips
 * to keep performances high.
 *
 * 1. Prefer spot lights to point lights and use the smallest outer cone angle possible.
 *
 * 2. Use the smallest possible falloff distance for point and spot lights.
 *    Performance is very sensitive to overlapping lights. The falloff distance essentially
 *    defines a sphere of influence for the light, so try to position point and spot lights
 *    such that they don't overlap too much.
 *
 *    On the other hand, a scene can contain hundreds of non overlapping lights without
 *    incurring a significant overhead.
 *
 */
export type LightConfig = BaseLightConfig &
  (
    | {
        /**
         *   - SUN,            //!< Directional light that also draws a sun's disk in the sky.
         *   - DIRECTIONAL,    //!< Directional light, emits light in a given direction.
         *   - POINT,          //!< Point light, emits light from a position, in all directions.
         *   - FOCUSED_SPOT,   //!< Physically correct spot light.
         *   - SPOT,           //!< Spot light with coupling of outer cone and illumination disabled.
         */
        type: 'directional' | 'sun'
      }
    | SpotLightExtraConfig
  )

export type LightType = LightConfig['type']
