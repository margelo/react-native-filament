import type { HybridObject } from 'react-native-nitro-modules'
import type { Aabb } from '../types/Aabb'
import type { Entity } from '../types/Entity'
import type { ModelInstance } from './ModelInstance.nitro'

export interface Model extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly rootEntity: Entity
  /** Every entity of every instance, including instances created later. @thread any */
  readonly entities: Entity[]
  /** Bounds of the model in its own space, from the glTF accessors. @thread any */
  readonly boundingBox: Aabb
  /** @thread any */
  readonly instanceCount: number
  /** @thread any */
  getInstance(index: number): ModelInstance
  /**
   * Adds an instance that shares the model's resources. Scenes that show the model show it too.
   * Prefer `instanceCount` at load time; gltfio keeps instances until the model is disposed.
   * @thread render
   */
  createInstance(): ModelInstance
  /**
   * Morph target names of a renderable entity of this model, in target index order.
   * @thread render
   */
  getMorphTargetNames(entity: Entity): string[]
  /** First entity with this glTF node name, if any. @thread any */
  getEntityByName(name: string): Entity | undefined
  /**
   * glTF node name of an entity of this model, if it has one.
   * @thread render
   */
  getEntityName(entity: Entity): string | undefined
}
