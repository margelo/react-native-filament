import { runOnJS } from 'react-native-worklets'

/**
 * Report an error to react native's `ErrorUtils` if available, or log to console otherwise.
 */
export function reportError(error: unknown, fatal: boolean): void {
  // @ts-expect-error this is defined by react-native.
  if (global.ErrorUtils != null) {
    if (fatal) {
      // @ts-expect-error this is defined by react-native.
      global.ErrorUtils.reportFatalError(error)
    } else {
      // @ts-expect-error this is defined by react-native.
      global.ErrorUtils.reportError(error)
    }
  } else {
    console.error(`An unknown Filament error occurred!`, error)
  }
}

const throwErrorOnJS = runOnJS((message: string, stack: string | undefined, fatal: boolean) => {
  const error = new Error()
  error.message = message
  error.stack = stack
  error.name = 'Filament Error'
  // @ts-expect-error this is react-native specific
  error.jsEngine = 'Filament'
  // From react-native:
  reportError(error, fatal)
})

export const reportWorkletError = (error: unknown, fatal = true): void => {
  'worklet'
  const safeError = error as Error | undefined
  const message = safeError != null && 'message' in safeError ? safeError.message : 'Filament threw an error.'
  throwErrorOnJS(message, safeError?.stack, fatal)
}

export const wrapWithErrorHandler = <T extends (...args: any[]) => any>(callback: T): ((...args: Parameters<T>) => ReturnType<T>) => {
  return (...args: Parameters<T>): ReturnType<T> => {
    'worklet'
    try {
      return callback(...args)
    } catch (error) {
      reportWorkletError(error)
      throw error
    }
  }
}
