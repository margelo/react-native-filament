import { reportWorkletError } from '../ErrorUtils'
import { FilamentProxy } from '../native/FilamentProxy'

export function runOnWorklet<T extends (...args: any[]) => any>(callback: T): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const workletContext = FilamentProxy.getWorkletContext()
  return workletContext.createRunAsync((...args) => {
    'worklet'
    try {
      return callback(...args)
    } catch (e) {
      reportWorkletError(e)
    }
  })
}
