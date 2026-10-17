/**
 * A native C++ Thread-Dispatcher.
 *
 * In Filament, usually 2 Dispatchers are exposed to JavaScript:
 * - The React-JS Thread Dispatcher
 * - The Filament render Thread Dispatcher
 *
 * Both Dispatchers can be received through `FilamentProxy.getCurrentDispatcher()`.
 */
export interface Dispatcher {
  _: never
}
