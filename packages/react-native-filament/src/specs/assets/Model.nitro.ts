import type { HybridObject } from 'react-native-nitro-modules'
import type { Aabb } from '../types/Aabb'
import type { Entity } from '../types/Entity'
import type { ModelInstance } from './ModelInstance.nitro'

export interface Model extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly rootEntity: Entity
  /** Every entity of every instance. @thread any */
  readonly entities: Entity[]
  /** Bounds of the model in its own space, from the glTF accessors. @thread any */
  readonly boundingBox: Aabb
  /** @thread any */
  readonly instanceCount: number
  /** @thread any */
  getInstance(index: number): ModelInstance
  /** First entity with this glTF node name, if any. @thread any */
  getEntityByName(name: string): Entity | undefined
}
