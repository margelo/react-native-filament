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

export interface Engine {
  setSurfaceProvider(surfaceProvider: SurfaceProvider): void
  setRenderCallback(callback: (engine: Engine) => void): void

  /**
   * Given a @see FilamentBuffer (e.g. from a .glb file), load the asset into the engine.
   * This will by default add all entities from the asset to the attached default scene.
   */
  loadAsset(buffer: FilamentBuffer): FilamentAsset

  /**
   * Set the indirect light for the scene.
   * @param iblBuffer A buffer containing the IBL data (e.g. from a .ktx file)
   */
  setIndirectLight(iblBuffer: FilamentBuffer): void

  getRenderer(): Renderer
  getScene(): Scene
  getCamera(): Camera
  getView(): View
  getCameraManipulator(): Manipulator

  createLightEntity(
    type: 'directional' | 'spot' | 'point' | 'focused_point' | 'sun',
    colorFahrenheit: number,
    intensity: number,
    directionX: number,
    directionY: number,
    directionZ: number,
    castShadows: boolean,
  ): Entity

  /**
   * Transforms the given entity to fit into a unit cube at the origin (0,0,0).
   * @param entity The entity to transform
   */
  transformToUnitCube(entity: FilamentAsset): void

  setEntityPosition(entity: Entity, position: Float3, multiplyCurrent: boolean): void
  setEntityRotation(entity: Entity, angleRadians: number, axis: Float3, multiplyCurrent: boolean): void
  setEntityScale(entity: Entity, scale: Float3, multiplyCurrent: boolean): void
}
