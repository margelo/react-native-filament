import { createContext } from 'react'
import type { Engine } from '../specs/engine/Engine.nitro'
import type { Camera } from '../specs/scene/Camera.nitro'
import type { LightManager } from '../specs/scene/LightManager.nitro'
import type { RenderableManager } from '../specs/scene/RenderableManager.nitro'
import type { Scene } from '../specs/scene/Scene.nitro'
import type { TransformManager } from '../specs/scene/TransformManager.nitro'

export interface FilamentSceneValue {
  engine: Engine
  scene: Scene
  /** The camera every `FilamentView` of the scene renders with. */
  camera: Camera
  transformManager: TransformManager
  renderableManager: RenderableManager
  lightManager: LightManager
}

export const FilamentSceneContext = createContext<FilamentSceneValue | undefined>(undefined)
