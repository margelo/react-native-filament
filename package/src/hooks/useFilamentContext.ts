import React from 'react'
import {
  RNFCamera,
  Choreographer,
  Engine,
  LightManager,
  NameComponentManager,
  RenderableManager,
  Renderer,
  Scene,
  TransformManager,
  View,
} from '../types'
import { IWorkletContext } from 'react-native-worklets-core'

export type FilamentContextType = {
  engine: Engine
  transformManager: TransformManager
  renderableManager: RenderableManager
  scene: Scene
  lightManager: LightManager
  view: View
  camera: RNFCamera
  renderer: Renderer
  nameComponentManager: NameComponentManager
  workletContext: IWorkletContext

  /**
   * This is a private API, do not use this.
   * @private
   * @internal
   */
  choreographer: Choreographer
}
export const FilamentContext = React.createContext<FilamentContextType | undefined>(undefined)

export function useFilamentContext() {
  'worklet'
  const context = React.useContext(FilamentContext)
  if (context === undefined) {
    throw new Error('You tried to use a Filament hook/component without wrapping your component in a <FilamentScene> component!')
  }
  return context
}
