import { Manipulator } from './Manipulator'

/**
 * Camera represents the eye through which the scene is viewed.
 *
 * A Camera has a position and orientation and controls the projection and exposure parameters.
 *
 * ## Creation and destruction
 *
 * In Filament, Camera is a component that must be associated with an entity. To do so,
 * use `Engine#createCamera(int)`. A Camera component is destroyed using
 * `Engine#destroyCameraComponent(int Entity)`.
 *
 * ```typescript
 *  const myCamera = engine.createCamera(myCameraEntity);
 *  myCamera.setProjection(45, 16.0/9.0, 0.1, 1.0);
 *  myCamera.lookAt(0, 1.60, 1,
 *                  0, 0, 0,
 *                  0, 1, 0);
 *  engine.destroyCameraComponent(myCameraEntity);
 * ```
 *
 * ## Coordinate system
 *
 * The camera coordinate system defines the *view space*. The camera points towards its -z axis
 * and is oriented such that its top side is in the direction of +y, and its right side in the
 * direction of +x.
 *
 * Since the *near* and *far* planes are defined by the distance from the camera,
 * their respective coordinates are -distance_near and -distance_far.
 *
 * ## Clipping planes
 *
 * The camera defines six *clipping planes* which together create a *clipping volume*. The
 * geometry outside this volume is clipped.
 *
 * The clipping volume can either be a box or a frustum depending on which projection is used,
 * respectively `Projection.ORTHO` or `Projection.PERSPECTIVE`. The six planes are specified
 * either directly or indirectly using `setProjection` or `setLensProjection`.
 *
 * The six planes are:
 * - left
 * - right
 * - bottom
 * - top
 * - near
 * - far
 *
 * To increase the depth-buffer precision, the *far* clipping plane is always assumed to be at
 * infinity for rendering. That is, it is not used to clip geometry during rendering.
 * However, it is used during the culling phase (objects entirely behind the *far*
 * plane are culled).
 *
 * ## Choosing the *near* plane distance
 *
 * The *near* plane distance greatly affects the depth-buffer resolution.
 *
 * Example: Precision at 1m, 10m, 100m and 1Km for various near distances assuming a 32-bit float
 * depth-buffer
 *
 * | near (m) | 1 m    | 10 m   | 100 m  | 1 Km   |
 * |----------|--------|--------|--------|--------|
 * | 0.001    | 7.2e-5 | 0.0043 | 0.4624 | 48.58  |
 * | 0.01     | 6.9e-6 | 0.0001 | 0.0430 | 4.62   |
 * | 0.1      | 3.6e-7 | 7.0e-5 | 0.0072 | 0.43   |
 * | 1.0      | 0      | 3.8e-6 | 0.0007 | 0.07   |
 *
 * As can be seen in the table above, the depth-buffer precision drops rapidly with the
 * distance to the camera.
 *
 * Make sure to pick the highest *near* plane distance possible.
 *
 * ## Exposure
 *
 * The Camera is also used to set the scene's exposure, just like with a real camera. The lights
 * intensity and the Camera exposure interact to produce the final scene's brightness.
 *
 * @see View
 */

export interface Camera {
  // Convenience method. The original method works slightly different, this is a simplification, so we don't have to deal with out params.
  lookAt(cameraManipulator: Manipulator): void
}
