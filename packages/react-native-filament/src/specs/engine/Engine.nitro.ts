import type { HybridObject } from 'react-native-nitro-modules'
import type { EngineBackend } from '../types/EngineBackend'
import type { RenderMode } from '../types/RenderMode'
import type { ViewTargetOptions } from '../types/ViewTargetOptions'
import type { FilamentView } from '../targets/FilamentView.nitro'
import type { ViewTarget } from '../targets/ViewTarget.nitro'

export interface Engine extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly backend: EngineBackend
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
