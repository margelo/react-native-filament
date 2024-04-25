export interface Surface {
  readonly width: number
  readonly height: number
}

export interface SurfaceProvider {
  /**
   * @private
   */
  getSurface(): Surface

  /**
   * Releases the reference on the surface. On iOS this will effectively release the memory of the surface.
   * @private
   */
  releaseSurface(): void
}

export interface FilamentView {
  /**
   * @private
   */
  getSurfaceProvider(): SurfaceProvider
}
