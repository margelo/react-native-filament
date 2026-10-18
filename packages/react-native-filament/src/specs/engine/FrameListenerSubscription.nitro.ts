import type { HybridObject } from 'react-native-nitro-modules'

/**
 * Returned by `Engine.addOnFrameListener()`. Call `remove()` to stop the listener. Dropping it does
 * not remove the listener; it runs until `remove()` or Engine shutdown.
 */
export interface FrameListenerSubscription extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Stops future calls. Idempotent. A frame already in progress may still call the listener once.
   * @thread any
   */
  remove(): void
}
