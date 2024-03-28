import { useMemo } from 'react'
import { Engine, Scene } from '../types'

export function useScene(engine: Engine): Scene {
  return useMemo(() => engine.getScene(), [engine])
}
