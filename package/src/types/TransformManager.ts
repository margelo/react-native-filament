import { Entity } from './Entity'
import { Float3 } from './float3'

export interface Mat4f {
  readonly data: number[]
  readonly scale: Float3
  scaling(scale: Float3): Mat4f
}

export interface TransformManager {
  getTransform(entity: Entity): Mat4f
  getWorldTransform(entity: Entity): Mat4f

  /**
   * Opens a local transform transaction. During a transaction, getWorldTransform() can
   * return an invalid transform until commitLocalTransformTransaction() is called. However,
   * setTransform() will perform significantly better and in constant time.
   *
   * This is useful when updating many transforms and the transform hierarchy is deep (say more
   * than 4 or 5 levels).
   *
   * @note If the local transform transaction is already open, this is a no-op.
   *
   * {@linkcode commitLocalTransformTransaction()}, {@linkcode setTransform()}
   */
  openLocalTransformTransaction(): void

  /**
   * Commits the currently open local transform transaction. When this returns, calls
   * to getWorldTransform() will return the proper value.
   *
   * @attention failing to call this method when done updating the local transform will cause
   *            a lot of rendering problems. The system never closes the transaction
   *            automatically.
   *
   * @note If the local transform transaction is not open, this is a no-op.
   *
   * {@linkcode openLocalTransformTransaction()}, {@linkcode setTransform()}
   */
  commitLocalTransformTransaction(): void

  /**
   * Sets a local transform of a transform component.
   * @param ci              The instance of the transform component to set the local transform to.
   * @param localTransform  The local transform (i.e. relative to the parent).
   * {@linkcode getTransform()}
   * @attention This operation can be slow if the hierarchy of transform is too deep, and this
   *            will be particularly bad when updating a lot of transforms. In that case,
   *            consider using openLocalTransformTransaction() / commitLocalTransformTransaction().
   */
  setTransform(entity: Entity, transform: Mat4f): void
}
