import { Worklets } from 'react-native-worklets-core'

export function runOnJS<T extends (...args: any[]) => any>(callback: T): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return Worklets.createRunInJsFn(callback)
}
