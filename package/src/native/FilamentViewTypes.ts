export interface TSurface {
  width: number
  height: number
}

export interface TSurfaceProvider {
  /**
   * @private
   */
  getSurface(): TSurface
}

export interface TFilamentView {
  /**
   * @private
   */
  getSurfaceProvider(): TSurfaceProvider
}
