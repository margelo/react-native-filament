/**
 * Report an error to react native's `ErrorUtils` if available, or log to console otherwise.
 */
export function reportError(error: unknown): void {
  // @ts-expect-error this is defined by react-native.
  if (global.ErrorUtils != null) {
    // @ts-expect-error this is defined by react-native.
    global.ErrorUtils.reportFatalError(error)
  } else {
    console.error(`An unknown Filament error occured!`, error)
  }
}
