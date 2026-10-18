import type { HybridObject } from 'react-native-nitro-modules'

/**
 * An image loaded with `Engine.loadTexture()`, for material parameters and background images.
 */
export interface Texture extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly width: number
  /** @thread any */
  readonly height: number
}
