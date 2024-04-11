import { useMemo } from 'react'
import type { Engine } from '../types'

export function useRenderableManager(engine: Engine) {
  return useMemo(() => engine.createRenderableManager(), [engine])
}
