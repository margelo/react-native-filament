import type { HybridObject } from 'react-native-nitro-modules'
import type { Entity } from '../types/Entity'

export interface Light extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly entity: Entity
}
