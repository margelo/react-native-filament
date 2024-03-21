import { Float3 } from './float3'

/**
 * An axis aligned box represented by its min and max coordinates
 */
export interface AABB {
  /**
   * The center of the box.
   */
  readonly center: Float3

  /**
   * The half-extent of the box.
   */
  readonly halfExtent: Float3
}
