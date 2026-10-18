import type { HybridObject } from 'react-native-nitro-modules'

/** A function kept on the runtime that created it, such as a render-thread effect cleanup. */
export interface RenderThreadCleanup extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Calls the function once, on the runtime that created it, after the work already queued there.
   * Later calls and calls after `dispose()` do nothing.
   * @thread any
   */
  run(): void
}
