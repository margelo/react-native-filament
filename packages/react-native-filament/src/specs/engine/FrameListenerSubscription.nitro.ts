import type { HybridObject } from 'react-native-nitro-modules'

/**
 * Returned by `Engine.addOnFrameListener()`. Call `remove()` to stop the listener.
 */
export interface FrameListenerSubscription extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Stops future calls. Idempotent. A frame already in progress may still call the listener once.
   * @thread any
   */
  remove(): void
}
