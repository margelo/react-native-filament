import { useEffect, useMemo } from 'react'
import { Engine, Scene } from '../types'

export function useScene(engine: Engine, id: string): Scene {
  const scene = useMemo(() => engine.getScene(), [engine])

  useEffect(() => {
    return () => {
      console.log('scene.release() called on', id)
      scene.release()
    }
  }, [scene])

  return scene
}
