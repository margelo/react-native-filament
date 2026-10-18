import { useContext } from 'react'
import type { FilamentSceneValue } from '../react/FilamentSceneContext'
import { FilamentViewContext } from '../react/FilamentViewContext'
import { useFilamentScene } from '../react/useFilamentScene'
import type { View } from '../specs/scene/View.nitro'
import type { ViewTarget } from '../specs/targets/ViewTarget.nitro'

export interface FilamentContextValue extends FilamentSceneValue {
  /** Rendering options of the closest `FilamentView`, once its surface exists. */
  view: View | undefined
  /** The target of the closest `FilamentView`, once its surface exists. */
  target: ViewTarget | undefined
}

/** The Engine, scene, camera and managers of the closest `FilamentScene`, and the closest view. */
export function useFilamentContext(): FilamentContextValue {
  const scene = useFilamentScene()
  const view = useContext(FilamentViewContext)
  return { ...scene, view: view?.view, target: view?.target }
}
