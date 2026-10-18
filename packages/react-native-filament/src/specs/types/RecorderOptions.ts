import type { ClearOptions } from './ClearOptions'

export interface RecorderOptions {
  /** Video width in pixels. Odd values are rounded down to even. */
  width: number
  /** Video height in pixels. Odd values are rounded down to even. */
  height: number
  /** Frame rate of the video; frame `i` is shown at `i / fps` seconds. */
  fps: number
  /** Target H.264 bit rate in bits per second. @default 0.1 bits per pixel per frame */
  bitRate?: number
  /** How each frame is cleared before rendering. */
  clearOptions?: ClearOptions
}
