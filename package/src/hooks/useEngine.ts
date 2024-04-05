import { useEffect, useMemo, useState } from 'react'
import type { Engine } from '../types'
import { FilamentProxy } from '../native/FilamentProxy'
import { useWorklet } from 'react-native-worklets-core'

interface EngineProps {
  /**
   * Whether the Engine render pipeline is paused or not.
   * @default false
   */
  isPaused?: boolean
}

export function useEngine({ isPaused = false }: EngineProps = {}): Engine | undefined {
  const [engine, setEngine] = useState<Engine | undefined>(undefined)
  const context = useMemo(() => FilamentProxy.getWorkletContext(), [])

  const createEngine: () => Promise<Engine> = useWorklet(
    context,
    () => {
      'worklet'
      return FilamentProxy.createEngine()
    },
    []
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
