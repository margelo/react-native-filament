import type { RenderCommit } from '../react/RenderCommit'
import type { WorkletContext } from './WorkletContext'

export function createWorkletContext(commit: RenderCommit): WorkletContext {
  return {
    runAsync<T>(worklet: () => T): Promise<T> {
      return commit.run(worklet)
    },
    createRunAsync<Args extends unknown[], T>(worklet: (...args: Args) => T): (...args: Args) => Promise<T> {
      return (...args: Args) =>
        commit.run(() => {
          'worklet'
          return worklet(...args)
        })
    },
  }
}
