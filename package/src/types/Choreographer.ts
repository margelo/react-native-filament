import { Listener } from './Listener'
import { PointerHolder } from './PointerHolder'

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

export interface Choreographer extends PointerHolder {
  start(): void
  stop(): void
  addFrameCallbackListener(callback: RenderCallback): Listener
}
