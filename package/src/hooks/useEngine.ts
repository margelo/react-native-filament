import { useEffect, useMemo } from 'react'
import type { Engine } from '../types'
import { FilamentProxy } from '../native/FilamentProxy'

interface EngineProps {
  /**
   * Whether the Engine render pipeline is paused or not.
   * @default false
   */
  isPaused?: boolean
}

export function useEngine({ isPaused = false }: EngineProps = {}): Engine {
  const engine = useMemo(() => FilamentProxy.createEngine(), [])

  useEffect(() => {
    engine.setIsPaused(isPaused)
  }, [engine, isPaused])

  return engine
}
