import { FilamentBuffer } from './FilamentBuffer.nitro'
import { Entity } from './Entity.nitro'
import { FilamentAsset } from './FilamentAsset.nitro'
import { FilamentInstance } from './FilamentInstance.nitro'
import type { Material } from './Material.nitro'
import type { MaterialInstance } from './MaterialInstance.nitro'
import { PointerHolder } from './PointerHolder.nitro'
import { Float3 } from './Math'
import { TextureFlags } from './TextureFlags'
import { Box } from './Boxes.nitro'

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
export interface RenderableManager extends PointerHolder {
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
   * @worklet
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
   * @worklet
   */
  createPlane(shadowMaterial: Material, halfExtendX: number, halfExtendY: number, halfExtendZ: number): Entity

  // TODO: document (its fullscreen)
  createImageBackgroundShape(material: Material): Entity

  /**
   * Takes an asset, gets the bounding box of all renderable entities and updates the bounding box to be multiplied by the given scale
   * factor.
   * Note: This was added as a workaround as there seems to be a bug in filament. When using an animator the asset for some reason is slightly transformed.
   * The bounding box doesn't seem to be updated to reflect this transformation. And the shadow is calculated the bounding box, which causes the shadow to appear clipped.
   */
  scaleBoundingBox(asset: FilamentAsset, scale: number): void

  /**
   * Creates the wireframe of a cube with the given half extent for debugging purposes.
   * Note: you don't have to supply a material. In that case the color will always be white.
   * You can't provide a different color than white if you don't provide a material.
   * @param color Provide a color in the format 0xRRGGBBAA
   */
  createDebugCubeWireframe(halfExtent: Float3, material: Material | undefined, color: number | undefined): Entity

  getAxisAlignedBoundingBox(entity: Entity): Box
}
