import { FilamentInstanceBase } from './FilamentInstanceBase'

/**
 * Every asset loaded has at least one FilamentInstance. You can load multiple instances of the same asset.
 *
 * Provides access to a hierarchy of entities that have been instanced from a glTF asset.
 *
 * Every entity has a TransformManager component, and some entities also have Name or
 * Renderable components.
 *
 */
export interface FilamentInstance extends FilamentInstanceBase {}
