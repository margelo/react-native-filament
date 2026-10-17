import { Entity } from './Entity'
import { FilamentInstance } from './FilamentInstance'
import { FilamentInstanceBase } from './FilamentInstanceBase'
import { PointerHolder } from './PointerHolder'

export interface FilamentAsset extends PointerHolder, FilamentInstanceBase {
  /**
   * Gets the list of entities in the asset that have renderable components.
   */
  getRenderableEntities: () => Entity[]

  /**
   * Gets the number of entities returned by renderableEntities.
   */
  readonly renderableEntityCount: number

  getFirstEntityByName(name: string): Entity | undefined

  /**
   * Reclaims CPU-side memory for URI strings, binding lists, and raw animation data.
   */
  releaseSourceData(): void

  /**
   * Convenience method to get the first instance.
   */
  getInstance(): FilamentInstance

  /**
   * Gets all instances associated with the asset.
   * List will only be greater than 1 if the asset was loaded with loadInstancedAsset.
   */
  getAssetInstances(): FilamentInstance[]

  /**
   * Gets the morph target name at the given index for the specified entity.
   * @param entity The entity to query
   * @param targetIndex The index of the morph target
   * @returns The name of the morph target at the given index
   */
  getMorphTargetNameAt(entity: Entity, targetIndex: number): string

  /**
   * Returns the number of morph targets in the given entity.
   * @param entity The entity to query
   * @returns The number of morph targets
   */
  getMorphTargetCountAt(entity: Entity): number
}
