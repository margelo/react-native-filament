import { LoggerInterface } from './LoggingInterface'

let loggerInstance: LoggerInterface | null = null

export const setLogger = (logger: LoggerInterface) => {
  loggerInstance = logger
}

export const getLogger = (): LoggerInterface => {
  if (loggerInstance == null) {
    const noopLogger: LoggerInterface = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    }
    return noopLogger
  }

  return loggerInstance
}
