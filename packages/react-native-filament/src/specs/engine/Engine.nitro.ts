import type { HybridObject, Sync } from 'react-native-nitro-modules'
import type { EngineBackend } from '../types/EngineBackend'
import type { FrameInfo } from '../types/FrameInfo'
import type { RenderMode } from '../types/RenderMode'
import type { ViewTargetOptions } from '../types/ViewTargetOptions'
import type { FilamentView } from '../targets/FilamentView.nitro'
import type { ViewTarget } from '../targets/ViewTarget.nitro'
import type { FrameListenerSubscription } from './FrameListenerSubscription.nitro'
import type { RenderThread } from './RenderThread.nitro'

export interface Engine extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly backend: EngineBackend
  /** @thread any */
  readonly renderThread: RenderThread
  /**
   * Cheap atomic store; wakes the render thread when demand changes.
   * @thread any
   */
  renderMode: RenderMode
  /**
   * Renders into `view` once its surface exists, and follows its surface changes.
   * @thread any
   */
  createViewTarget(view: FilamentView, options: ViewTargetOptions): Promise<ViewTarget>
  /**
   * Calls `listener` once per rendered frame, before native systems run and the targets render.
   * The listener returns whether it needs another frame: in `on-demand` mode the Engine keeps
   * rendering while any listener returns `true`. In `continuous` mode every frame renders anyway.
   * @thread render
   */
  addOnFrameListener(listener: Sync<(frame: FrameInfo) => boolean>): FrameListenerSubscription
  /**
   * Renders one more frame in `on-demand` mode.
   * @thread any
   */
  requestFrame(): void
  /**
   * Starts shutdown if needed. Every caller's Promise resolves after every native resource is
   * destroyed and the render thread has exited.
   * @thread RN or UI runtime
   */
  shutdown(): Promise<void>
}
