import type { HybridObject } from 'react-native-nitro-modules'
import type { Entity } from '../types/Entity'
import type { Model } from '../assets/Model.nitro'
import type { IndirectLight } from './IndirectLight.nitro'
import type { Skybox } from './Skybox.nitro'

export interface Scene extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Number of entities in the scene.
   * @thread render
   */
  readonly entityCount: number
  /**
   * Adds an entity that has a renderable or light component in this Engine.
   * @thread render
   */
  addEntity(entity: Entity): void
  /** @thread render */
  removeEntity(entity: Entity): void
  /**
   * Adds every renderable and light entity of every instance of the model.
   * @thread render
   */
  addModel(model: Model): void
  /** @thread render */
  removeModel(model: Model): void
  /**
   * Image-based lighting of the scene, or `undefined` for none.
   * @thread render
   */
  setIndirectLight(light: IndirectLight | undefined): void
  /**
   * Background of the scene, or `undefined` for none.
   * @thread render
   */
  setSkybox(skybox: Skybox | undefined): void
}
