import type { Float4 } from './Float4'

export interface ClearOptions {
  /** Linear RGBA. @default [0, 0, 0, 0] */
  color?: Float4
  /** Clears to `color` before each frame. @default true */
  clear?: boolean
  /** Discards the previous frame's content instead of loading it. @default true */
  discard?: boolean
}
