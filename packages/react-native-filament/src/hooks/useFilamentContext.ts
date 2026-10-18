import { useContext } from 'react'
import type { FilamentSceneValue } from '../react/FilamentSceneContext'
import { FilamentViewContext } from '../react/FilamentViewContext'
import { useFilamentScene } from '../react/useFilamentScene'
import type { View } from '../specs/scene/View.nitro'
import type { ViewTarget } from '../specs/targets/ViewTarget.nitro'

export interface FilamentContextValue extends FilamentSceneValue {
  /** Rendering options of the closest `FilamentView`. `undefined` until the view's `ViewTarget` is created. */
  view: View | undefined
  /**
   * The target of the closest `FilamentView`. `undefined` until the view's `ViewTarget` is created.
   * The target can exist before its surface does; until then its `width` and `height` are 0.
   */
  target: ViewTarget | undefined
}

/** The Engine, scene, camera and managers of the closest `FilamentScene`, and the closest view. */
export function useFilamentContext(): FilamentContextValue {
  const scene = useFilamentScene()
  const view = useContext(FilamentViewContext)
  return { ...scene, view: view?.view, target: view?.target }
}
