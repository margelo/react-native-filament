import type { HybridObject } from 'react-native-nitro-modules'
import type { Float4 } from '../types/Float4'

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
  /**
   * Linear RGBA the target is cleared to before each frame.
   * @thread render
   */
  setClearColor(color: Float4): void
}
