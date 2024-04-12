export interface FilamentBuffer {
  /**
   * Internal method to release memory early when the buffer is no longer needed.
   */
  release(): void
}

export type Asset = FilamentBuffer
