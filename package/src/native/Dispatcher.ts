export interface Dispatcher {
  nothing: never
}

declare global {
  /**
   * Contains the calling Thread's {@linkcode Dispatcher}, or `undefined` if the
   * current JS Runtime does not have a Dispatcher (e.g. when it was not created by Filament)
   */
  var __promiseFactoryDispatcher: Dispatcher | undefined
}
