import type { Entity } from './Entity'
import type { FilamentAsset } from './FilamentAsset'

/**
 * A `Scene` is a flat container of `RenderableManager` and `LightManager`
 * components.
 *
 * A `Scene` doesn't provide a hierarchy of objects, i.e.: it's not a scene-graph.
 * However, it manages the list of objects to render and the list of lights. These can
 * be added or removed from a `Scene` at any time.
 * Moreover clients can use `TransformManager` to create a graph of transforms.
 *
 * A `RenderableManager` component must be added to a `Scene` in order
 * to be rendered, and the `Scene` must be provided to a `View`.
 *
 * ## Creation and Destruction
 *
 * A `Scene` is created using `Engine#createScene` and destroyed using
 * `Engine#destroyScene(Scene)`.
 *
 * @see View
 * @see LightManager
 * @see RenderableManager
 * @see TransformManager
 */

export interface Scene {
  /**
   * Adds a single entity to the scene.
   * If you want to add your asset to the scene, which likely contains multiple entities,
   * use {@link addAssetEntities} instead.
   */
  addEntity(entity: Entity): void

  /**
   * Removes the Renderable from the Scene.
   **/
  removeEntity(entity: Entity): void

  /**
   * Adds all entities associated with the given asset to the scene.
   */
  addAssetEntities(asset: FilamentAsset): void
  /**
   * Removes all entities associated with the given asset from the scene.
   */
  removeAssetEntities(asset: FilamentAsset): void
}
