import { useEffect, useState } from 'react'
import { Filament } from '../Filament'
import { useReportFailure } from '../react/useReportFailure'
import type { Engine } from '../specs/engine/Engine.nitro'
import type { EngineBackend } from '../specs/types/EngineBackend'

/**
 * Creates an Engine and shuts it down on unmount, for several `FilamentScene`s to share through
 * their `engine` prop.
 */
export function useEngine(backend?: EngineBackend): Engine | undefined {
  const [engine, setEngine] = useState<Engine>()
  const fail = useReportFailure()
  useEffect(() => {
    let active = true
    const creating = Promise.resolve().then(() => (active ? Filament.createEngine({ backend }) : undefined))
    creating.then(
      (created) => {
        if (active) setEngine(created)
      },
      (error: unknown) => {
        if (active) fail(error)
      }
    )
    return () => {
      active = false
      setEngine(undefined)
      creating.then(
        (created) => created?.shutdown(),
        () => undefined
      )
    }
  }, [backend, fail])
  return engine
}
