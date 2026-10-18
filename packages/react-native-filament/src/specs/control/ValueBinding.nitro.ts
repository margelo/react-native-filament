import type { HybridObject } from 'react-native-nitro-modules'

/** A number that any thread can write and render-thread code can read without waiting on another runtime. */
export interface ValueBinding extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Stores the value and requests a frame.
   * @thread any
   */
  set(value: number): void
  /**
   * Latest value set.
   * @thread any
   */
  readonly value: number
}
