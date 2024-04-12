import { Camera } from './Camera'
import { SurfaceProvider } from '../native/FilamentViewTypes'
import { Manipulator } from './Manipulator'
import { Renderer } from './Renderer'
import { Scene } from './Scene'
import { View } from './View'
import { FilamentBuffer } from '../native/FilamentBuffer'
import { Entity } from './Entity'
import { FilamentAsset } from './FilamentAsset'
import { Float3 } from './float3'
import { RigidBody } from '../bullet'
import { TransformManager } from './TransformManager'
import { RenderableManager } from './RenderableManager'
import { Material } from './Material'
import { LightManager } from './LightManager'

export type RenderCallback = (timestamp: number, startTime: number, passedSeconds: number) => void

export interface Engine {
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
   * Transforms the given entity to fit into a unit cube at the origin (0,0,0).
   * @param entity The entity to transform
   */
  transformToUnitCube(entity: FilamentAsset): void

  setEntityPosition(entity: Entity, position: Float3, multiplyCurrent: boolean): void
  setEntityRotation(entity: Entity, angleRadians: number, axis: Float3, multiplyCurrent: boolean): void
  setEntityScale(entity: Entity, scale: Float3, multiplyCurrent: boolean): void

  /**
   * Controls whether the engine is currently actively rendering, or not.
   * Pausing the engine will stop the choreographer and no frame callbacks will be invoked.
   * @param isPaused whether the rendering will be paused or not. Default: false
   */
  setIsPaused(isPaused: boolean): void

  updateTransformByRigidBody(entity: Entity, rigidBody: RigidBody): void

  /**
   * Note: the reference returned isn't stable, and each call will return a new reference.
   * Prefer using the hook `useTransformManager` to get a stable reference.
   */
  getTransformManager(): TransformManager

  /**
   * Note: the reference returned isn't stable, and each call will return a new reference.
   * Prefer using the hook `useRenderableManager` to get a stable reference.
   */
  createRenderableManager(): RenderableManager

  /**
   * Creates a new material from the given FilamentBuffer.
   * @worklet
   */
  createMaterial(matcBuffer: FilamentBuffer): Material

  createLightManager(): LightManager
}
