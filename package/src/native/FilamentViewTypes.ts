export interface Surface {
  readonly width: number
  readonly height: number
}

export interface SurfaceProvider {
  /**
   * @private
   */
  getSurface(): Surface
}

export interface TFilamentView {
  /**
   * @private
   */
  getSurfaceProvider(): SurfaceProvider
}
