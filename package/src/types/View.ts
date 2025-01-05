import { RNFCamera } from './Camera'
import { Entity } from './Entity'
import { AmbientOcclusionOptions, BloomOptions, DynamicResolutionOptions } from './Options'
import { PointerHolder } from './PointerHolder'
import { Scene } from './Scene'
import { Float3 } from './Math'

export interface Viewport {
  bottom: number
  left: number
  width: number
  height: number
}

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
  camera: RNFCamera
  scene: Scene
  // Can return 0 if the view isn't ready yet.
  getAspectRatio(): number
  getViewport(): Viewport
  setAmbientOcclusionOptions(options: AmbientOcclusionOptions): void
  getAmbientOcclusionOptions(): AmbientOcclusionOptions
  setBloomOptions(options: BloomOptions): void
  getBloomOptions(): BloomOptions
  setDynamicResolutionOptions(options: DynamicResolutionOptions): void
  getDynamicResolutionOptions(): DynamicResolutionOptions

  /**
   * Enables or disables screen space refraction.
   * @default true
   */
  screenSpaceRefraction: boolean

  /**
   * Enables or disables post processing. Enabled by default.
   *
   * Post-processing includes:
   *  - Depth-of-field
   *  - Bloom
   *  - Vignetting
   *  - Temporal Anti-aliasing (TAA)
   *  - Color grading & gamma encoding
   *  - Dithering
   *  - FXAA
   *  - Dynamic scaling
   *
   * Disabling post-processing forgoes color correctness as well as some anti-aliasing techniques
   * and should only be used for debugging, UI overlays or when using custom render targets
   * (see RenderTarget).
   *
   * @default true
   *
   * @see setBloomOptions, setColorGrading, setAntiAliasing, setDithering, setSampleCount
   */
  postProcessing: boolean

  /**
   * Enables or disables shadow mapping. Enabled by default.
   *
   *
   * @see LightManager::Builder::castShadows(),
   *      RenderableManager::Builder::receiveShadows(),
   *      RenderableManager::Builder::castShadows(),
   *
   * @default true
   */
  shadowing: boolean

  /**
   * Enables or disables anti-aliasing in the post-processing stage. Enabled by default.
   * MSAA can be enabled in addition, see setSampleCount().
   *
   * @param type FXAA for enabling, NONE for disabling anti-aliasing.
   *
   * @note For MSAA anti-aliasing, see setSamplerCount().
   *
   * @default 'FXAA'
   */
  antiAliasing: 'none' | 'FXAA'

  /**
   * Enables or disables dithering in the post-processing stage. Enabled by default.
   *
   * @default 'temporal'
   */
  dithering: 'none' | 'temporal'

  // Internal helper to create HostObject options object
  createAmbientOcclusionOptions(): AmbientOcclusionOptions
  createBloomOptions(): BloomOptions
  createDynamicResolutionOptions(): DynamicResolutionOptions

  /**
   * Given a world position, returns the 2D screen coordinates.
   */
  projectWorldToScreen(worldPosition: Float3): [x: number, y: number]

  /**
   * Given 2D screen coordinates, returns the entity at that position.
   * Returns undefined if no entity is found.
   */
  pickEntity(x: number, y: number): Promise<Entity | null>

  /**
   * This type is the raw expected valeu for JSI.
   * The type is encoded in {@linkcode TemporalAntiAliasingOptions}
   */
  temporalAntiAliasingOptions: Record<string, number>
}
