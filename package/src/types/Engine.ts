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

export type RenderCallback = (timestamp: number, startTime: number, passedSeconds: number) => void

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

  getRenderer(): Renderer
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
}
