import { Choreographer } from '../types'
import { Listener } from '../types/Listener'
import { Dispatcher } from './Dispatcher'

export interface Surface {
  readonly width: number
  readonly height: number
}

export interface SurfaceProvider {
  /**
   * @private
   */
  getSurface(): Surface | undefined

  /**
   * Called once the surface is available to draw (android: onSurfaceTextureAvailable, ios:
   * called almost immediately after the view is created).
   * @private
   */
  addOnSurfaceCreatedListener(listener: (surface: Surface) => void, dispatcher: Dispatcher): Listener

  /**
   * @private
   */
  addOnSurfaceDestroyedListener(listener: () => void, dispatcher: Dispatcher): Listener
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
