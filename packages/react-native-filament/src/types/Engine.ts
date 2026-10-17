import { RNFCamera } from './Camera'
import { SurfaceProvider } from '../native/FilamentViewTypes'
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
import { TFilamentRecorder } from './FilamentRecorder'
import { SwapChain } from './SwapChain'
import { NameComponentManager } from './NameComponentManager'
import { CameraManipulator, OrbitCameraManipulatorConfig } from './CameraManipulator'

export interface Engine extends PointerHolder {
  setSurfaceProvider(surfaceProvider: SurfaceProvider): void
  // TODO: Document
  createSwapChainForSurface(surface: SurfaceProvider, enableTransparentRendering: boolean): SwapChain
  // TODO: Document
  createSwapChainForRecorder(recorder: TFilamentRecorder): SwapChain
  setSwapChain(swapChain: SwapChain): void

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
  getCamera(): RNFCamera
  getView(): View
  createOrbitCameraManipulator(config: OrbitCameraManipulatorConfig): CameraManipulator
  /**
   * @private
   */
  createNameComponentManager(): NameComponentManager

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

  /**
   * Enables or disables automatic instancing of render primitives. Instancing of render
   * primitives can greatly reduce CPU overhead but requires the instanced primitives to be
   * identical (i.e. use the same geometry) and use the same MaterialInstance. If it is known
   * that the scene doesn't contain any identical primitives, automatic instancing can have some
   * overhead and it is then best to disable it.
   *
   * Disabled by default.
   *
   * @param enable true to enable, false to disable automatic instancing.
   */
  setAutomaticInstancingEnabled(enabled: boolean): void

  /**
   * Kicks the hardware thread (e.g. the OpenGL, Vulkan or Metal thread) and blocks until
   * all commands to this point are executed. Note that does guarantee that the
   * hardware is actually finished.
   * Note: during on screen rendering this is handled automatically, typically used for offscreen rendering (recording).
   */
  flushAndWait(): void
}
