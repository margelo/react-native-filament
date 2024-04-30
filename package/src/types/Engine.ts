import { Camera } from './Camera'
import { SurfaceProvider } from '../native/FilamentViewTypes'
import { Manipulator } from './Manipulator'
import { Renderer } from './Renderer'
import { Scene } from './Scene'
import { View } from './View'
import { FilamentBuffer } from '../native/FilamentBuffer'
import { FilamentAsset } from './FilamentAsset'
import { TransformManager } from './TransformManager'
import { RenderableManager } from './RenderableManager'
import { Material } from './Material'
import { LightManager } from './LightManager'
import { PointerHolder } from './PointerHolder'

export type FrameInfo = {
  /**
   * The current timestamp in nanoseconds.
   */
  timestamp: number
  /**
   * Timestamp when the rendering started
   */
  startTime: number
  /**
   * Time in seconds since the rendering started.
   */
  passedSeconds: number
  /** Time in seconds since the last frame. */
  timeSinceLastFrame: number
}

export type RenderCallback = (frameInfo: FrameInfo) => void

export interface Engine extends PointerHolder {
  setSurfaceProvider(surfaceProvider: SurfaceProvider): void
  setRenderCallback(callback: RenderCallback | undefined): void

  /**
   * Given a {@linkcode FilamentBuffer} (e.g. from a .glb file), load the asset into the engine.
   */
  loadAsset(buffer: FilamentBuffer): FilamentAsset

  /**
   * Given a @see FilamentBuffer (e.g. from a .glb file), load the asset into the engine.
   * It will create multiple instances of the asset.
   */
  loadInstancedAsset(buffer: FilamentBuffer, instanceCount: number): FilamentAsset

  /**
   * Set the indirect light for the scene.
   * @param iblBuffer A buffer containing the IBL data (e.g. from a .ktx file)
   * @param intensity The intensity of the indirect light. Default: 30_000
   * @param irradianceBands Number of spherical harmonics bands. Must be 1, 2 or 3. Default: 3
   */
  setIndirectLight(iblBuffer: FilamentBuffer, intensity: number | undefined, irradianceBands: number | undefined): void

  /**
   * Given a @see FilamentBuffer (e.g. from a .glb file), load the asset into the engine.
   * This will by default add all entities from the asset to the attached default scene.
   * @worklet
   */
  loadAsset(buffer: FilamentBuffer): FilamentAsset

  createRenderer(): Renderer
  getScene(): Scene
  getCamera(): Camera
  getView(): View
  getCameraManipulator(): Manipulator

  /**
   * Controls whether the engine is currently actively rendering, or not.
   * Pausing the engine will stop the choreographer and no frame callbacks will be invoked.
   * @param isPaused whether the rendering will be paused or not. Default: false
   */
  setIsPaused(isPaused: boolean): void

  /**
   * Per engine instance you only need one {@linkcode TransformManager}.
   * You should never need to call this manually, use instead from `useFilamentContext()`.
   */
  createTransformManager(): TransformManager
  /**
   * Per engine instance you only need one {@linkcode RenderableManager}.
   * You should never need to call this manually, use instead from `useFilamentContext()`.
   */
  createRenderableManager(): RenderableManager
  /**
   * Per engine instance you only need one {@linkcode LightManager}.
   * You should never need to call this manually, use instead from `useFilamentContext()`.
   */
  createLightManager(): LightManager

  /**
   * Creates a new material from the given FilamentBuffer.
   * @worklet
   */
  createMaterial(matcBuffer: FilamentBuffer): Material

  /**
   * Skybox
   *
   * When added to a Scene, the Skybox fills all untouched pixels.
   * By default the scene has no skybox and will be rendered as translucent.
   * When using a skybox make sure to pass {@linkcode enableTransparentRendering} as false.
   *
   * @param showSun Indicates whether the sun should be rendered. The sun can only be
   *                rendered if there is at least one light of type SUN in the scene.
   *                Default: false
   * @param envIntensity Skybox intensity when no IndirectLight is set on the Scene.
   *                     This call is ignored when an IndirectLight is set on the Scene, and the intensity
   *                     of the IndirectLight is used instead.
   *                     Scale factor applied to the skybox texel values such that
   *                     the result is in lux, or lumen/m^2 (default = 30000)
   **/
  createAndSetSkyboxByColor: (colorInHex: string, showSun: boolean | undefined, envIntensity: number | undefined) => void

  /**
   * Skybox
   *
   * When added to a Scene, the Skybox fills all untouched pixels.
   * By default the scene has no skybox and will be rendered as translucent.
   * When using a skybox make sure to pass {@linkcode enableTransparentRendering} as false.
   *
   * @param showSun Indicates whether the sun should be rendered. The sun can only be
   *                rendered if there is at least one light of type SUN in the scene.
   *                Default: false
   * @param envIntensity Skybox intensity when no IndirectLight is set on the Scene.
   *                     This call is ignored when an IndirectLight is set on the Scene, and the intensity
   *                     of the IndirectLight is used instead.
   *                     Scale factor applied to the skybox texel values such that
   *                     the result is in lux, or lumen/m^2 (default = 30000)
   **/
  createAndSetSkyboxByTexture: (buffer: FilamentBuffer, showSun: boolean | undefined, envIntensity: number | undefined) => void

  /**
   * Removed the skybox from the scene.
   */
  clearSkybox: () => void
}
