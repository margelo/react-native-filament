import { AABB } from './AABB'
import type { Animator } from './Animator'
import type { Entity } from './Entity'
import { FilamentInstance } from './FilamentInstance'

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

  getFirstEntityByName(name: string): Entity | undefined

  /**
   * Convenience method to get the first instance.
   */
  getInstance(): FilamentInstance

  /**
   * Gets all instances associated with the asset.
   * List will only be greater than 1 if the asset was loaded with loadInstancedAsset.
   */
  getAssetInstances(): FilamentInstance[]

  /**
   * Helper method to release all memory associated with the asset.
   * Only call this whn the asset is not going to be used anywhere in JS any longer.
   * Calling this will automatically remove it from the scene its in.
   * @note The memory will only be fully released if all animators you may have created from this asset are also released.
   */
  release(): void
}
