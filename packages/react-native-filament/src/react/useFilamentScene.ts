import { useContext } from 'react'
import { FilamentSceneContext, type FilamentSceneValue } from './FilamentSceneContext'

export function useFilamentScene(): FilamentSceneValue {
  const scene = useContext(FilamentSceneContext)
  if (scene == null) {
    throw new Error('Filament hooks and components must be used inside a <FilamentScene>.')
  }
  return scene
}
