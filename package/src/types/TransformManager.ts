import { RigidBody } from '../bullet'
import { Entity } from './Entity'
import { FilamentAsset } from './FilamentAsset'
import { Float3 } from './float3'

/**
 * A 4x4 column-major matrix.
 */
export interface Mat4 {
  readonly data: number[]
  readonly scale: Float3
  readonly translation: Float3

  /**
   * Returns a new matrix that is the result of multiplying the provided scale matrix with this matrix.
   */
  scaling(scale: Float3): Mat4

  /**
   * Returns a new matrix that is the result of multiplying the provided translation matrix with this matrix.
   */
  translate(translation: Float3): Mat4

  /**
   * Returns a new matrix that is the result of multiplying the provided rotation matrix with this matrix.
   */
  rotateX(angleRadians: number, axis: Float3): Mat4
}

/**
 * TransformManager is used to add transform components to entities.
 *
 * A Transform component gives an entity a position and orientation in space in the coordinate
 * space of its parent transform. The TransformManager takes care of computing the world-space
 * transform of each component (i.e. its transform relative to the root).
 */
export interface TransformManager {
  /**
   * Returns the local transform of a transform component.
   * @param ci The instance of the transform component to query the local transform from.
   * @return The local transform of the component (i.e. relative to the parent). This always
   *         returns the value set by setTransform().
   * {@linkcode setTransform()}
   */
  getTransform(entity: Entity): Mat4

  /**
   * Return the world transform of a transform component.
   * @param ci The instance of the transform component to query the world transform from.
   * @return The world transform of the component (i.e. relative to the root). This is the
   *         composition of this component's local transform with its parent's world transform.
   * {@linkcode setTransform()}
   */
  getWorldTransform(entity: Entity): Mat4

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
  setTransform(entity: Entity, transform: Mat4): void

  /**
   * Creates a new identity matrix.
   */
  createIdentityMatrix(): Mat4

  /**
   * Transforms the given entity to fit into a unit cube at the origin (0,0,0).
   * @param entity The entity to transform
   */
  transformToUnitCube(entity: FilamentAsset): void

  /**
   * Sets the position of an entity.
   * @param multiplyCurrent If true, the new position will be multiplied with the current transform.
   */
  setEntityPosition(entity: Entity, position: Float3, multiplyCurrent: boolean): void

  /**
   * Sets the rotation of an entity.
   * @param multiplyCurrent If true, the new rotation will be multiplied with the current transform.
   */
  setEntityRotation(entity: Entity, angleRadians: number, axis: Float3, multiplyCurrent: boolean): void

  /**
   * Sets the scale of an entity.
   * @param multiplyCurrent If true, the new scale will be multiplied with the current transform.
   */
  setEntityScale(entity: Entity, scale: Float3, multiplyCurrent: boolean): void

  /**
   * Updates the transform of an entity based on the rigid body's transform.
   */
  updateTransformByRigidBody(entity: Entity, rigidBody: RigidBody): void
}
