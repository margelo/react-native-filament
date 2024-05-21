import { PointerHolder } from './PointerHolder'

export interface CameraWrapper extends PointerHolder {
  /**
   * In MAP and ORBIT modes, dollys the camera along the viewing direction.
   * In FREE_FLIGHT mode, adjusts the move speed of the camera.
   *
   * @param x X-coordinate for point of interest in viewport space, ignored in FREE_FLIGHT mode
   * @param y Y-coordinate for point of interest in viewport space, ignored in FREE_FLIGHT mode
   * @param scrolldelta In MAP and ORBIT modes, negative means "zoom in", positive means "zoom out"
   *                    In FREE_FLIGHT mode, negative means "slower", positive means "faster"
   */
  scroll(x: number, y: number, scrolldelta: number): void

  /**
   * Processes input and updates internal state.
   *
   * This must be called once every frame before getLookAt is valid.
   *
   * @param deltaTime The amount of time, in seconds, passed since the previous call to update.
   */
  update(deltaTime: number): void

  /**
   * Starts a grabbing session (i.e. the user is dragging around in the viewport).
   *
   * In MAP mode, this starts a panning session.
   * In ORBIT mode, this starts either rotating or strafing.
   * In FREE_FLIGHT mode, this starts a nodal panning session.
   *
   * @param x X-coordinate for point of interest in viewport space
   * @param y Y-coordinate for point of interest in viewport space
   * @param strafe ORBIT mode only; if true, starts a translation rather than a rotation
   */
  grabBegin(x: number, y: number, strafe: boolean): void

  /**
   * Updates a grabbing session.
   *
   * This must be called at least once between grabBegin / grabEnd to dirty the camera.
   */
  grabUpdate(x: number, y: number): void

  /**
   * Ends a grabbing session.
   */
  grabEnd(): void
}
