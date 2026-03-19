import { runOnJS, scheduleOnRuntime, WorkletRuntime } from 'react-native-worklets'

export function scheduleOnRuntimeAsync<T>(runtime: WorkletRuntime, worklet: () => T): Promise<T> {
  let resolve: (result: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  scheduleOnRuntime(runtime, () => {
    'worklet'
    const result = worklet()
    runOnJS(resolve)(result)
  })
  return promise
}
