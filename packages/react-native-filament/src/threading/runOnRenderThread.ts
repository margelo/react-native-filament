import { createSerializable, scheduleOnRN } from 'react-native-worklets'
import type { Engine } from '../specs/engine/Engine.nitro'
import { renderThreadOf } from './renderThreadOf'

/**
 * Runs `worklet` on the render thread of `engine` and resolves with its result.
 * Jobs run in the order they were submitted. Rejects with `FilamentDisposedError` if the Engine shuts
 * down before the job runs.
 * @thread RN runtime
 */
export function runOnRenderThread<T>(engine: Engine, worklet: () => T): Promise<T> {
  const thread = renderThreadOf(engine)
  return new Promise<T>((resolve, reject) => {
    const fail = (message: string) => reject(new Error(message))
    const job = createSerializable(() => {
      'worklet'
      try {
        scheduleOnRN(resolve, worklet())
      } catch (error) {
        scheduleOnRN(fail, error instanceof Error ? error.message : String(error))
      }
    })
    thread.runAsync(job, fail)
  })
}
