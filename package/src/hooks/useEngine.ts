import { useEffect, useState } from 'react'
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

const context = FilamentProxy.getWorkletContext()

export function useEngine({ isPaused = false }: EngineProps = {}): Engine | undefined {
  const [engine, setEngine] = useState<Engine | undefined>(undefined)

  const createEngine: () => Promise<Engine> = useWorklet(
    context,
    () => {
      'worklet'
      return FilamentProxy.createEngine()
    },
    []
  )

  useEffect(() => {
    createEngine().then(setEngine)
  }, [createEngine])

  useEffect(() => {
    if (engine == null) return
    engine.setIsPaused(isPaused)
  }, [engine, isPaused])

  return engine
}
