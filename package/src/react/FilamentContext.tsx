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

  // TODO: put this in an "internal" separate context?
  /**
   * @private
   */
  _choreographer: Choreographer
}
export const FilamentContext = React.createContext<FilamentContextType | undefined>(undefined)

export function useFilamentContext() {
  const context = React.useContext(FilamentContext)
  if (context === undefined) {
    throw new Error(
      'useFilamentContext (and its hooks such as `useScene()`, components like `<Filament />` etc.) must be used within a `<FilamentProvider>` component!'
    )
  }
  return context
}
export function FilamentConsumer({ children }: { children: (value: FilamentContextType) => React.ReactNode }) {
  const context = useFilamentContext()

  return <FilamentContext.Consumer>{() => children(context)}</FilamentContext.Consumer>
}
