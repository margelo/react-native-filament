import type { HybridObject } from 'react-native-nitro-modules'
import type { Entity } from '../types/Entity'
import type { Animator } from './Animator.nitro'

export interface ModelInstance extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly rootEntity: Entity
  /** @thread any */
  readonly entities: Entity[]
  /** @thread any */
  readonly animator: Animator
  /** Names of the glTF material variants (KHR_materials_variants). @thread any */
  readonly materialVariants: string[]
  /** @thread render */
  applyMaterialVariant(index: number): void
  /** @thread any */
  readonly skinCount: number
  /**
   * Skins `target`, an entity with a mesh that has bone indices and weights, with this instance's
   * skeleton.
   * @thread render
   */
  attachSkin(skinIndex: number, target: Entity): void
  /** @thread render */
  detachSkin(skinIndex: number, target: Entity): void
  /**
   * Copies the local transform of every joint of `source` to the joint with the same name in this
   * instance at the start of each frame, after animation players, then updates this instance's bone
   * matrices: clothing follows a character. `undefined` stops following.
   * @thread render
   */
  followSkeleton(source: ModelInstance | undefined): void
  /**
   * Recomputes the bounds of every renderable from its vertices. Only needed for assets whose
   * glTF accessors lack correct min/max values; it does not account for skinning or morphing.
   * @thread render
   */
  recomputeBoundingBoxes(): void
}
