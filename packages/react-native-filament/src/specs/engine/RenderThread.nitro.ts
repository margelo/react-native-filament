import type { HybridObject } from 'react-native-nitro-modules'
import type { RenderThreadCleanup } from './RenderThreadCleanup.nitro'

/**
 * The Engine's render thread, where render-thread worklets, frame listeners and `@thread render`
 * methods run.
 */
export interface RenderThread extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Whether the calling thread is this Engine's render thread.
   * @thread any
   */
  readonly isCurrentThread: boolean
  /**
   * Whether a worklet runtime runs on this thread yet. `runOnRenderThread` creates it on first use.
   * @thread any
   */
  readonly hasRuntime: boolean
  /**
   * Keeps `cleanup` until the returned handle runs it. For cleanups that capture values of the render
   * runtime and so cannot travel to another runtime.
   * @thread any
   */
  retainCleanup(cleanup: () => void): RenderThreadCleanup
}
