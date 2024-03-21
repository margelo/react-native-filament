import { AABB } from './AABB'
import type { Animator } from './Animator'
import type { Entity } from './Entity'

export interface FilamentAsset {
  /**
   * Gets the transform root for the asset, which has no matching glTF node.
   *
   * This node exists for convenience, allowing users to transform the entire asset. For instanced
   * assets, this is a "super root" where each of its children is a root in a particular instance.
   * This allows users to transform all instances en masse if they wish to do so.
   */
  getRoot(): Entity

  getAnimator(): Animator
  /**
   * Reclaims CPU-side memory for URI strings, binding lists, and raw animation data.
   */
  releaseSourceData(): void

  /**
   * Creates a new animator with the animations from the given asset.
   */
  createAnimatorWithAnimationsFrom(asset: FilamentAsset): Animator

  /**
   * Gets the list of entities, one for each glTF node. All of these have a Transform component.
   * Some of the returned entities may also have a Renderable component and/or a Light component.
   */
  getEntities: () => Entity[]

  /**
   * Gets the number of entities returned by entities.
   */
  readonly entityCount: number

  /**
   * Gets the list of entities in the asset that have renderable components.
   */
  getRenderableEntities: () => Entity[]

  /**
   * Gets the number of entities returned by renderableEntities.
   */
  readonly renderableEntityCount: number

  /**
   * Gets the bounding box computed from the supplied min / max values in glTF accessors.
   *
   * This does not return a bounding box over all FilamentInstance, it's just a straightforward
   * AAAB that can be determined at load time from the asset data.
   */
  readonly boundingBox: AABB
}
