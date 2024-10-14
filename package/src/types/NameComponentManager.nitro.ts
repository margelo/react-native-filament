import { Entity } from './Entity.nitro'
import { PointerHolder } from './PointerHolder.nitro'

/**
 * The name component manager is responsible for managing the names of entities.
 */
export interface NameComponentManager extends PointerHolder {
  getEntityName(entity: Entity): string | undefined
}
