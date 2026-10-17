import { AABB } from './Boxes'
import { Animator } from './Animator'
import { Entity } from './Entity'
import { NameComponentManager } from './NameComponentManager'

export interface FilamentInstanceBase {
  /**
   * Gets the transform root for the asset, which has no matching glTF node.
   *
   * This node exists for convenience, allowing users to transform the entire asset. For instanced
   * assets, this is a "super root" where each of its children is a root in a particular instance.
   * This allows users to transform all instances en masse if they wish to do so.
   */
  getRoot(): Entity

  createAnimator(nameComponentManager: NameComponentManager): Animator

  /**
   * Gets the list of entities, one for each glTF node. All of these have a Transform component.
   * Some of the returned entities may also have a Renderable component and/or a Light component.
   */
  getEntities: () => Entity[]

  /**
   * Gets the bounding box computed from the supplied min / max values in glTF accessors.
   *
   * This does not return a bounding box over all FilamentInstance, it's just a straightforward
   * AAAB that can be determined at load time from the asset data.
   */
  getBoundingBox(): AABB

  /**
   * Gets the number of entities returned by entities.
   */
  readonly entityCount: number
}
