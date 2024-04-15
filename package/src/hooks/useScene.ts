import { useEffect, useMemo } from 'react'
import { Engine, Scene } from '../types'

export function useScene(engine: Engine): Scene {
  const scene = useMemo(() => engine.getScene(), [engine])

  // useEffect(() => {
  //   return () => {
  //     scene.release()
  //   }
  // }, [scene])

  return scene
}
