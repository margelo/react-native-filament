import type { Engine, EngineBackend, EngineConfig } from '../types'
import { FilamentProxy } from '../native/FilamentProxy'
import { useDisposableResource } from './useDisposableResource'
import { type WorkletRuntime } from 'react-native-worklets'
import { useCallback } from 'react'
import { scheduleOnRuntimeAsync } from '../utilities/scheduleOnRuntimeAsync'

export interface EngineProps {
  /**
   * The backend to be used. By default it picks "opengl" for android and "metal" for ios.
   */
  backend?: EngineBackend

  /**
   * The engine config. Can be used to tweak buffer sizes.
   * You probably don't need that unless you do a lot and ran into engine crashes.
   */
  config?: EngineConfig

  runtime: WorkletRuntime
}

export function useEngine({ backend, config, runtime }: EngineProps): Engine | undefined {
  // Important: create the engine on the worklet thread, so its owned by the worklet thread
  const createEngine = useCallback(() => {
    return scheduleOnRuntimeAsync(runtime, () => {
      'worklet'
      return FilamentProxy.createEngine(backend ?? undefined, config ?? undefined)
    })
  }, [backend, config, runtime])

  const engine = useDisposableResource(createEngine)
  return engine
}
