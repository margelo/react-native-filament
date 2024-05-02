export type FrameInfo = {
  /**
   * The current timestamp in nanoseconds.
   */
  timestamp: number
  /**
   * Timestamp when the rendering started
   */
  startTime: number
  /**
   * Time in seconds since the rendering started.
   */
  passedSeconds: number
  /** Time in seconds since the last frame. */
  timeSinceLastFrame: number
}

export type RenderCallback = (frameInfo: FrameInfo) => void

export interface Choreographer {
  start(): void
  stop(): void
  setFrameCallback(callback: RenderCallback): void
}
