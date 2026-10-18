import type { HybridObject } from 'react-native-nitro-modules'
import type { LookAt } from '../types/LookAt'

/**
 * Orbits a camera around a target from drag and pinch input. Commands are queued from any thread
 * and applied in order at the next frame start; cameras that follow the manipulator take its pose.
 * Coordinates are points from the top-left corner of the view the input comes from.
 *
 * At most 256 commands wait per frame. Consecutive `grabUpdate`s and same-anchor `scroll`s merge,
 * so the limit is only reached by flooding other commands; those calls throw
 * `FilamentQueueFullError` and change nothing. A started drag can always end.
 */
export interface CameraManipulator extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Starts a drag that orbits, or pans when `strafe` is true. Ends a drag still in progress first.
   * @thread any
   */
  grabBegin(x: number, y: number, strafe: boolean): void
  /** @thread any */
  grabUpdate(x: number, y: number): void
  /** @thread any */
  grabEnd(): void
  /**
   * Zooms; a negative `delta` moves closer to the target.
   * @thread any
   */
  scroll(x: number, y: number, delta: number): void
  /**
   * Returns to the home position.
   * @thread any
   */
  jumpToHome(): void
  /**
   * Size in points of the view the input comes from. Needed for panning and the vertical axis.
   * @thread any
   */
  setViewport(width: number, height: number): void
  /**
   * Latest pose published by the render thread. `target` is the point the camera orbits around.
   * @thread any
   */
  getLookAt(): LookAt
}
