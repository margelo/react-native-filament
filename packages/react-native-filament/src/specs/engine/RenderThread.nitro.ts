import type { HybridObject } from 'react-native-nitro-modules'

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
}
