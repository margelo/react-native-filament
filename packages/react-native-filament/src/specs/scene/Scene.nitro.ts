import type { HybridObject } from 'react-native-nitro-modules'
import type { Entity } from '../types/Entity'
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
   * Background of the scene, or `undefined` for none.
   * @thread render
   */
  setSkybox(skybox: Skybox | undefined): void
}
