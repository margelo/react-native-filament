import { Entity } from './Entity'

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
  addEntity(entity: Entity): void
}
