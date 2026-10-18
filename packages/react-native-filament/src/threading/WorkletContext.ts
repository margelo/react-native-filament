/**
 * Runs worklets on the render thread of a `FilamentScene`'s Engine, after the render-thread work of the
 * current commit, like 1.x's `workletContext`.
 * @thread RN runtime
 */
export interface WorkletContext {
  /** Runs `worklet` on the render thread and resolves with its result. */
  runAsync<T>(worklet: () => T): Promise<T>
  /** A function that runs `worklet` on the render thread with its arguments and resolves with its result. */
  createRunAsync<Args extends unknown[], T>(worklet: (...args: Args) => T): (...args: Args) => Promise<T>
}
