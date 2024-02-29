import { Camera } from './Camera'
import { SurfaceProvider } from '../native/FilamentViewTypes'
import { Manipulator } from './Manipulator'
import { Renderer } from './Renderer'
import { Scene } from './Scene'
import { View } from './View'
import { FilamentBuffer } from '../native/FilamentBuffer'
import { Entity } from './Entity'

export interface Engine {
  setSurfaceProvider(surfaceProvider: SurfaceProvider): void
  setRenderCallback(callback: (engine: Engine) => void): void

  loadAsset(buffer: FilamentBuffer): void
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
}
