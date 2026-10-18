import type { Float3 } from './Float3'
import type { Float4 } from './Float4'

export interface DebugBoxOptions {
  /** Half size of the box along each axis. */
  halfExtent: Float3
  /** Center of the box. @default [0, 0, 0] */
  center?: Float3
  /** Linear RGBA color of the edges. @default [0, 1, 0, 1] */
  color?: Float4
}
