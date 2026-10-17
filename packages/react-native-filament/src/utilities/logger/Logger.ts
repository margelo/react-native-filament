import { LoggerInterface } from './LoggingInterface'

let loggerInstance: LoggerInterface | null = null

export const setLogger = (logger: LoggerInterface) => {
  loggerInstance = logger
}

const noopLogger: LoggerInterface = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
}

export const getLogger = (): LoggerInterface => {
  if (loggerInstance == null) {
    return noopLogger
  }

  return loggerInstance
}

export const Logger = new Proxy(noopLogger, {
  get: (_target, prop) => {
    return getLogger()[prop as keyof LoggerInterface]
  },
})
