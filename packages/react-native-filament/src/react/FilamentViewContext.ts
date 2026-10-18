import { createContext } from 'react'
import type { View } from '../specs/scene/View.nitro'
import type { ViewTarget } from '../specs/targets/ViewTarget.nitro'
import type { PickResult } from '../specs/types/PickResult'

export interface FilamentViewValue {
  target: ViewTarget
  view: View
  /** Calls `handler` with what lies under every press on the view. Returns the remover. */
  addPressHandler(handler: (result: PickResult) => void): () => void
}

export const FilamentViewContext = createContext<FilamentViewValue | undefined>(undefined)
