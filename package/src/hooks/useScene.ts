import { useMemo } from 'react'
import { Engine, Scene } from '../types'

export function useScene(engine: Engine): Scene {
  const scene = useMemo(() => engine.getScene(), [engine])
  return scene
}
