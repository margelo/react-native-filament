import { FilamentBuffer } from '../native/FilamentBuffer'
import { Entity } from './Entity'
import { FilamentAsset } from './FilamentAsset'
import { FilamentInstance } from './FilamentInstance'
import { Material } from './Material'
import { MaterialInstance } from './MaterialInstance'

export type TextureFlags = 'none' | 'sRGB'

/**
 * Factory and manager for \em renderables, which are entities that can be drawn.
 *
 * Renderables are bundles of \em primitives, each of which has its own geometry and material. All
 * primitives in a particular renderable share a set of rendering attributes, such as whether they
 * cast shadows or use vertex skinning.
 *
 * Usage example:
 *
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * auto renderable = utils::EntityManager::get().create();
 *
 * RenderableManager::Builder(1)
 *         .boundingBox({{ -1, -1, -1 }, { 1, 1, 1 }})
 *         .material(0, matInstance)
 *         .geometry(0, RenderableManager::PrimitiveType::TRIANGLES, vertBuffer, indBuffer, 0, 3)
 *         .receiveShadows(false)
 *         .build(engine, renderable);
 *
 * scene->addEntity(renderable);
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *
 * To modify the state of an existing renderable, clients should first use RenderableManager
 * to get a temporary handle called an \em instance. The instance can then be used to get or set
 * the renderable's state. Please note that instances are ephemeral; clients should store entities,
 * not instances.
 *
 * - For details about constructing renderables, see RenderableManager::Builder.
 * - To associate a 4x4 transform with an entity, see TransformManager.
 * - To associate a human-readable label with an entity, see utils::NameComponentManager.
 */
export interface RenderableManager {
  getPrimitiveCount(renderable: Entity): number
  getMaterialInstanceAt(renderable: Entity, index: number): MaterialInstance
  setMaterialInstanceAt(renderable: Entity, index: number, material: MaterialInstance): void

  /**
   * Convenience method to apply the given opacity to every material of all the asset's entities.
   * Prefer to use this method over `getMaterialInstanceAt` and `setOpacity` for performance reasons.
   * Note: This will be applied to all instances of the asset in case its an instanced asset.
   * If you need to control the opacity of each instance separately, see {@linkcode setInstanceEntitiesOpacity}
   */
  setAssetEntitiesOpacity(asset: FilamentAsset, opacity: number): void

  /**
   * Convenience method to apply the given opacity to every material of all the instances's entities.
   * Prefer to use this method over `getMaterialInstanceAt` and `setOpacity` for performance reasons.
   */
  setInstanceEntitiesOpacity(instance: FilamentInstance, opacity: number): void

  /**
   * Sets the baseColorMap parameter to the given textureBuffer.
   */
  changeMaterialTextureMap(renderable: Entity, materialName: string, textureBuffer: FilamentBuffer, textureFlags: TextureFlags): void

  /**
   * Changes whether or not the renderable casts shadows.
   * @default false
   **/
  setCastShadow(renderable: Entity, castShadow: boolean): void

  /**
   * Changes whether or not the renderable can receive shadows.
   * @default false
   **/
  setReceiveShadow(renderable: Entity, receiveShadow: boolean): void

  /**
   * Creates a plane with the material provided. Creates it at the 0,0,0 origin.
   * @param shadowMaterial See {@link Engine.createMaterial}
   */
  createPlane(shadowMaterial: Material, halfExtendX: number, halfExtendY: number, halfExtendZ: number): Entity

  /**
   * Takes an asset, gets the bounding box of all renderable entities and updates the bounding box to be multiplied by the given scale
   * factor.
   * Note: This was added as a workaround as there seems to be a bug in filament. When using an animator the asset for some reason is slightly transformed.
   * The bounding box doesn't seem to be updated to reflect this transformation. And the shadow is calculated the bounding box, which causes the shadow to appear clipped.
   */
  scaleBoundingBox(asset: FilamentAsset, scale: number): void
}
