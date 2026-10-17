import type { HybridObject } from 'react-native-nitro-modules'
import type { Aabb } from '../types/Aabb'
import type { Entity } from '../types/Entity'
import type { MaterialInstance } from '../materials/MaterialInstance.nitro'

/**
 * Reads and writes the renderable components of entities. Every method runs on the render thread
 * and throws `FilamentInvalidEntityError` for an entity without a renderable component in this
 * Engine.
 */
export interface RenderableManager extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  getPrimitiveCount(entity: Entity): number
  isShadowCaster(entity: Entity): boolean
  setCastShadows(entity: Entity, castShadows: boolean): void
  isShadowReceiver(entity: Entity): boolean
  setReceiveShadows(entity: Entity, receiveShadows: boolean): void
  /** Bounds in the entity's own space, used for culling and shadows. */
  getAxisAlignedBoundingBox(entity: Entity): Aabb
  setAxisAlignedBoundingBox(entity: Entity, boundingBox: Aabb): void
  /** Multiplies the half extent of the bounds, for vertices moved by skinning or morphing. */
  scaleBoundingBox(entity: Entity, scale: number): void
  /** Draw order among renderables with the same blending, from 0 (first) to 7. @default 4 */
  setPriority(entity: Entity, priority: number): void
  /** Frustum culling of the entity. @default true */
  setCulling(entity: Entity, enabled: boolean): void
  /**
   * The material instance of one primitive. For a model's entity it is the model's instance, usable
   * while the model is alive.
   */
  getMaterialInstanceAt(entity: Entity, primitiveIndex: number): MaterialInstance
  /**
   * Draws one primitive with `instance`. The renderable keeps the instance alive until it is
   * replaced. Disposing the instance falls back to its material's default instance, and disposing
   * the material falls back to Filament's default material.
   */
  setMaterialInstanceAt(entity: Entity, primitiveIndex: number, instance: MaterialInstance): void
}
