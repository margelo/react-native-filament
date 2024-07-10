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
}
