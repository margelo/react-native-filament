import { Worklets } from 'react-native-worklets-core'

/**
 * Report an error to react native's `ErrorUtils` if available, or log to console otherwise.
 */
export function reportFatalError(error: unknown): void {
  // @ts-expect-error this is defined by react-native.
  if (global.ErrorUtils != null) {
    // @ts-expect-error this is defined by react-native.
    global.ErrorUtils.reportFatalError(error)
  } else {
    console.error(`An unknown Filament error occurred!`, error)
  }
}

const throwErrorOnJS = Worklets.createRunOnJS((message: string, stack: string | undefined) => {
  const error = new Error()
  error.message = message
  error.stack = stack
  error.name = 'Filament Error'
  // @ts-expect-error this is react-native specific
  error.jsEngine = 'Filament'
  // From react-native:
  // @ts-ignore the reportFatalError method is an internal method of ErrorUtils not exposed in the type definitions
  reportFatalError(error)
})

export function reportWorkletError(error: unknown): void {
  'worklet'
  const safeError = error as Error | undefined
  const message = safeError != null && 'message' in safeError ? safeError.message : 'Filament threw an error.'
  throwErrorOnJS(message, safeError?.stack)
}

export function wrapWithErrorHandler<T extends (...args: any[]) => any>(callback: T): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    'worklet'
    try {
      return callback(...args)
    } catch (error) {
      reportFatalError(error)
      throw error
    }
  }
}
