import type { HybridObject } from 'react-native-nitro-modules'

export interface ViewTarget extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Drawable width in pixels of the current surface, 0 while there is none.
   * @thread any
   */
  readonly width: number
  /**
   * Drawable height in pixels of the current surface, 0 while there is none.
   * @thread any
   */
  readonly height: number
}
