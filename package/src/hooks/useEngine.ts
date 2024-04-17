import { useEffect, useMemo, useState } from 'react'
import type { Engine, EngineBackend, EngineConfig } from '../types'
import { FilamentProxy } from '../native/FilamentProxy'
import { useWorklet } from 'react-native-worklets-core'

interface EngineProps {
  /**
   * Whether the Engine render pipeline is paused or not.
   * @default false
   */
  isPaused?: boolean

  /**
   * The backend to be used. By default it picks "opengl" for android and "metal" for ios.
   */
  backend?: EngineBackend

  /**
   * The engine config. Can be used to tweak buffer sizes.
   * You probably don't need that unless you do a lot and ran into engine crashes.
   */
  config?: EngineConfig
}

export function useEngine({ backend, config, isPaused = false }: EngineProps = {}): Engine | undefined {
  const [engine, setEngine] = useState<Engine | undefined>(undefined)
  // Note: we can't use the FilamentContext here, as useEngine is used to create the context itself.
  const context = useMemo(() => FilamentProxy.getWorkletContext(), [])

  const createEngine = useWorklet(
    context,
    () => {
      'worklet'
      return FilamentProxy.createEngine(backend ?? undefined, config ?? undefined)
    },
    [backend, config]
  )

  useEffect(() => {
    // Once the engine is created we don't need to create another one
    // This is especially important for fast refresh not to break.
    if (engine != null) return

    createEngine().then(setEngine)
  }, [createEngine, engine])

  useEffect(() => {
    if (engine == null) return
    engine.setIsPaused(isPaused)
  }, [engine, isPaused])

  return engine
}
