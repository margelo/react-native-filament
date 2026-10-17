import type { HybridObject } from 'react-native-nitro-modules'
import type { Aabb } from '../types/Aabb'
import type { Entity } from '../types/Entity'
import type { Float3 } from '../types/Float3'
import type { Mat4 } from '../types/Mat4'
import type { Quaternion } from '../types/Quaternion'

/**
 * Reads and writes the transform components of entities. Every method throws
 * `FilamentInvalidEntityError` for an entity without a transform component in this Engine.
 */
export interface TransformManager extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Transform relative to the parent.
   * @thread render
   */
  getTransform(entity: Entity): Mat4
  /** @thread render */
  getWorldTransform(entity: Entity): Mat4
  /** @thread render */
  setTransform(entity: Entity, transform: Mat4): void
  /**
   * Replaces the translation of the local transform and keeps its rotation and scale.
   * @thread render
   */
  setTranslation(entity: Entity, translation: Float3): void
  /**
   * Replaces the rotation of the local transform and keeps its translation and scale.
   * @thread render
   */
  setRotation(entity: Entity, rotation: Quaternion): void
  /**
   * Replaces the scale of the local transform and keeps its translation and rotation.
   * @thread render
   */
  setScale(entity: Entity, scale: Float3): void
  /** @thread render */
  getParent(entity: Entity): Entity | undefined
  /**
   * Attaches `entity` to `parent`, or makes it a root for `undefined`.
   * @thread render
   */
  setParent(entity: Entity, parent: Entity | undefined): void
  /**
   * Sets the local transform so that `boundingBox`, given in the entity's own space, is centered
   * at the origin and fits the cube from -1 to 1.
   * @thread render
   */
  transformToUnitCube(entity: Entity, boundingBox: Aabb): void
  /**
   * Defers world-transform updates until `commitLocalTransformTransaction()`, for many changes in
   * one frame.
   * @thread render
   */
  openLocalTransformTransaction(): void
  /** @thread render */
  commitLocalTransformTransaction(): void
}
