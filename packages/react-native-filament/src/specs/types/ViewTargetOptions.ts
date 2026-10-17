import type { Float4 } from './Float4'

export interface ViewTargetOptions {
  /**
   * Linear RGBA the target is cleared to before each frame. Defaults to transparent black.
   */
  clearColor?: Float4
}
