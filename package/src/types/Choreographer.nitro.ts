import { Listener } from './Listener.nitro'
import { PointerHolder } from './PointerHolder.nitro'

export interface FrameInfo {
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

// TODO: I think i want to implement this as kotlin / swift
export interface Choreographer extends PointerHolder {
  start(): void
  stop(): void
  addFrameCallbackListener(callback: RenderCallback): Listener
}
