/**
 * A value that lives on the UI runtime and notifies listeners there, such as a Reanimated
 * `SharedValue`. Listener methods are called only on the UI runtime.
 */
export interface ListenableValue<T> {
  readonly value: T
  addListener(listenerId: number, listener: (value: T) => void): void
  removeListener(listenerId: number): void
}
