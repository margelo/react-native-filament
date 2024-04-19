import { Camera } from './Camera'
import { AmbientOcclusionOptions, DynamicResolutionOptions } from './Options'
import { PointerHolder } from './PointerHolder'
import { Scene } from './Scene'

/**
 * Encompasses all the state needed for rendering a {@link Scene}.
 *
 * {@link Renderer#render} operates on `View` objects. These `View` objects
 * specify important parameters such as:
 *
 * - The Scene
 * - The Camera
 * - The Viewport
 * - Some rendering parameters
 *
 * `View` instances are heavy objects that internally cache a lot of data needed for
 * rendering. It is not advised for an application to use many View objects.
 *
 * For example, in a game, a `View` could be used for the main scene and another one for
 * the game's user interface. More `View` instances could be used for creating special
 * effects (e.g. a `View` is akin to a rendering pass).
 **/

export interface View extends PointerHolder {
  camera: Camera
  scene: Scene
  // Can return 0 if the view isn't ready yet.
  getAspectRatio(): number
  setViewport(x: number, y: number, width: number, height: number): void
  setAmbientOcclusionOptions(options: AmbientOcclusionOptions): void
  getAmbientOcclusionOptions(): AmbientOcclusionOptions
  setDynamicResolutionOptions(options: DynamicResolutionOptions): void
  getDynamicResolutionOptions(): DynamicResolutionOptions

  // Internal helper to create HostObject options object
  createAmbientOcclusionOptions(): AmbientOcclusionOptions
  createDynamicResolutionOptions(): DynamicResolutionOptions
}
