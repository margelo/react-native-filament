import type { HybridObject } from 'react-native-nitro-modules'
import type { Entity } from '../types/Entity'

/**
 * Geometry created and owned by RNF. `dispose()` removes it from every scene and destroys its
 * entity and buffers; the renderable keeps its material instance alive until then.
 */
export interface Renderable extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly entity: Entity
}
