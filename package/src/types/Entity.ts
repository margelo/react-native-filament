import { HybridObject } from 'react-native-nitro-modules'

/**
 * Everything inside the scene is an entity.
 * Entities are managed by the EntityManager.
 */
export interface Entity extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  id: number
}

// TODO: make a pointer holder
