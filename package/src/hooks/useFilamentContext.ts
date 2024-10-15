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
import { BoxedHybridObject } from 'react-native-nitro-modules/lib/BoxedHybridObject'

export type FilamentContextType = {
  engine: BoxedHybridObject<Engine>
  transformManager: BoxedHybridObject<TransformManager>
  renderableManager: BoxedHybridObject<RenderableManager>
  scene: BoxedHybridObject<Scene>
  lightManager: BoxedHybridObject<LightManager>
  view: BoxedHybridObject<View>
  camera: BoxedHybridObject<RNFCamera>
  renderer: BoxedHybridObject<Renderer>
  nameComponentManager: BoxedHybridObject<NameComponentManager>
  workletContext: IWorkletContext

  /**
   * This is a private API, do not use this.
   * @private
   * @internal
   */
  choreographer: BoxedHybridObject<Choreographer>
}
export const FilamentContext = React.createContext<FilamentContextType | undefined>(undefined)

export function useFilamentContext() {
  const context = React.useContext(FilamentContext)
  if (context === undefined) {
    throw new Error('You tried to use a Filament hook/component without wrapping your component in a <FilamentScene> component!')
  }
  return context
}
