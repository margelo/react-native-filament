import { PointerHolder } from './PointerHolder'

/**
 * The name component manager is responsible for managing the names of entities.
 * Currently we only need the NameComponentManager to create animators, which might need entity names internally.
 */
export interface NameComponentManager extends PointerHolder {
  _nameComponentManagerType: never
}
