import { Float3 } from './float3'

export interface BaseBox {
  /**
   * The center of the box.
   */
  readonly center: Float3

  /**
   * The half-extent of the box.
   */
  readonly halfExtent: Float3

  /**
   * Computes the lowest coordinates corner of the box.
   * @return center - halfExtent
   */
  readonly min: Float3

  /**
   * Computes the largest coordinates corner of the box.
   * @return center + halfExtent
   */
  readonly max: Float3
}

/**
 * An axis aligned 3D box represented by its center and half-extent.
 */
export interface Box extends BaseBox {
  // Note: this property isn't set on the object and is just for type checking
  _type: 'Box'
}

/**
 * An axis aligned box represented by its min and max coordinates
 */
export interface AABB extends BaseBox {
  // Note: this property isn't set on the object and is just for type checking
  _type: 'AABB'
}
