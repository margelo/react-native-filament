import { createWorkletRuntime, type WorkletRuntime } from 'react-native-worklets'
import type { Engine } from '../specs/engine/Engine.nitro'
import type { RenderThread } from '../specs/engine/RenderThread.nitro'

export interface RenderThreadRuntimeBinding extends RenderThread {
  createQueue(): object
  bindRuntime(runtime: WorkletRuntime): void
  bindPooledRuntime(): boolean
  runAsync(job: unknown, onCancelled: (message: string) => void): void
}

export function renderThreadOf(engine: Engine): RenderThreadRuntimeBinding {
  const thread = engine.renderThread as RenderThreadRuntimeBinding
  if (!thread.hasRuntime && !thread.bindPooledRuntime()) {
    thread.bindRuntime(createWorkletRuntime({ name: 'FilamentRender', useDefaultQueue: false, customQueue: thread.createQueue() }))
  }
  return thread
}
