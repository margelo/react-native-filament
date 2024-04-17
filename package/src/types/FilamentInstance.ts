import { AABB } from './AABB'
import { Animator } from './Animator'
import { Entity } from './Entity'

/**
 * Provides access to a hierarchy of entities that have been instanced from a glTF asset.
 *
 * Every entity has a TransformManager component, and some entities also have Name or
 * Renderable components.
 *
 */
export interface FilamentInstance {
  getEntities(): Entity[]
  getRoot(): Entity
  createAnimator(): Animator
  getBoundingBox(): AABB
}
