import type { Entity } from './Entity'
import type { Float3 } from './Float3'

export interface PickResult {
  /** The renderable entity under the point. */
  entity: Entity
  /** Where the point hits the renderable, in world space. */
  worldPosition: Float3
}
