import { HybridObject } from 'react-native-nitro-modules'
import { Choreographer } from '../types'
import { Listener } from '../types/Listener.nitro'

export interface Surface extends HybridObject<{ android: 'c++', ios: 'c++' }> {
  readonly width: number
  readonly height: number
}

export interface SurfaceProvider extends HybridObject<{ android: 'c++', ios: 'c++' }> {
  /**
   * @private
   */
  getSurface(): Surface | undefined

  /**
   * Called once the surface is available to draw (android: onSurfaceTextureAvailable, ios:
   * called almost immediately after the view is created).
   * @private
   */
  addOnSurfaceCreatedListener(listener: (surface: Surface) => void): Listener

  /**
   * @private
   */
  addOnSurfaceDestroyedListener(listener: () => void): Listener
}

export interface FilamentView {
  /**
   * @private
   */
  getSurfaceProvider(): SurfaceProvider

  /**
   * @private
   * Links the surface with the choreographer. When the view gets destroyed, the choreographer will be stopped.
   */
  setChoreographer(choreographer?: Choreographer): void
}
