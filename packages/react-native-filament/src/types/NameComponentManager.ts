import { Entity } from './Entity'
import { PointerHolder } from './PointerHolder'

/**
 * The name component manager is responsible for managing the names of entities.
 */
export interface NameComponentManager extends PointerHolder {
  getEntityName(entity: Entity): string | undefined
}
