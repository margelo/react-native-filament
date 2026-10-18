import type { HybridObject } from 'react-native-nitro-modules'
import type { ClearOptions } from '../types/ClearOptions'
import type { ListenerSubscription } from '../types/ListenerSubscription'
import type { PickResult } from '../types/PickResult'
import type { Camera } from '../scene/Camera.nitro'
import type { Scene } from '../scene/Scene.nitro'
import type { View } from '../scene/View.nitro'
import type { Snapshot } from './Snapshot.nitro'

export interface ViewTarget extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Drawable width in pixels of the current surface, 0 while there is none.
   * @thread any
   */
  readonly width: number
  /**
   * Drawable height in pixels of the current surface, 0 while there is none.
   * @thread any
   */
  readonly height: number
  /**
   * Rendering options of this target. The object is usable from any thread; its members run on the
   * render thread.
   * @thread any
   */
  readonly view: View
  /**
   * Highest rate in frames per second this target renders at, or `0` to render on every display
   * refresh. Frame listeners and native systems still run on every frame of the Engine.
   * @default 0
   * @thread any
   */
  targetFrameRate: number
  /**
   * Called with the drawable size in pixels whenever it changes, and once right away if the
   * target already has a surface.
   * @thread any
   */
  addOnResizeListener(listener: (width: number, height: number) => void): ListenerSubscription
  /**
   * Scene this target renders. Without one, the target only clears.
   * @thread render
   */
  setScene(scene: Scene): void
  /** @thread render */
  setCamera(camera: Camera): void
  /**
   * Called once after this target renders its first frame, or right away if it already has.
   * @thread any
   */
  addOnFirstFrameListener(listener: () => void): ListenerSubscription
  /**
   * The renderable under a point, in points from the top-left corner of the view, or `undefined`
   * if there is none. Resolves after the next rendered frame; rejects with `FilamentDisposedError`
   * if the target is disposed first.
   * @thread any
   */
  pick(x: number, y: number): Promise<PickResult | undefined>
  /**
   * Captures the next rendered frame.
   * @thread any
   */
  takeSnapshot(): Promise<Snapshot>
  /**
   * How the target is cleared before each frame.
   * @thread render
   */
  setClearOptions(options: ClearOptions): void
}
