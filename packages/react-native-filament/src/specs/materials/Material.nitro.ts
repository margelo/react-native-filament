import type { HybridObject } from 'react-native-nitro-modules'
import type { MaterialInstance } from './MaterialInstance.nitro'

/** A compiled material (`.filamat`, from Filament's `matc` of the same version). */
export interface Material extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly materialName: string
  /** @thread any */
  readonly parameterNames: string[]
  /**
   * The instance shared by every renderable that uses the material without its own instance.
   * @thread render
   */
  readonly defaultInstance: MaterialInstance
  /** @thread render */
  createInstance(): MaterialInstance
}
