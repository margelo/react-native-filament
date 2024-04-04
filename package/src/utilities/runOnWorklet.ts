import { Worklets } from 'react-native-worklets-core'
import { FilamentProxy } from '../native/FilamentProxy'

export function runOnWorklet<T extends (...args: any[]) => any>(callback: T): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const workletContext = FilamentProxy.getWorkletContext()
  return Worklets.createRunInContextFn(callback, workletContext)
}
