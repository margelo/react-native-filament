import React from 'react'
import { findNodeHandle, NativeMethods } from 'react-native'
import { FilamentProxy } from './native/FilamentProxy'
import { FilamentNativeView, NativeProps } from './native/FilamentNativeView'
import { Engine } from './types'
import { FilamentView } from './native/FilamentViewTypes'
import { reportError } from './ErrorUtils'

export interface FilamentProps extends NativeProps {
  engine: Engine
}

type RefType = React.Component<NativeProps> & Readonly<NativeMethods>

export class Filament extends React.PureComponent<FilamentProps> {
  private readonly ref: React.RefObject<RefType>
  private view: FilamentView | undefined = undefined

  constructor(props: FilamentProps) {
    super(props)
    this.ref = React.createRef<RefType>()
    this.view = undefined
  }

  // TODO: Does this also work for Fabric?
  private get handle(): number {
    const nodeHandle = findNodeHandle(this.ref.current)
    if (nodeHandle == null || nodeHandle === -1) {
      throw new Error("Could not get the FilamentView's native view tag! Does the FilamentView exist in the native view-tree?")
    }

    return nodeHandle
  }

  onViewReady = async () => {
    try {
      const handle = this.handle
      this.view = await FilamentProxy.findFilamentView(handle)
      if (this.view == null) {
        throw new Error(`Failed to find FilamentView #${handle}!`)
      }
      const surfaceProvider = this.view.getSurfaceProvider()
      // Link the surface with the engine:
      this.props.engine.setSurfaceProvider(surfaceProvider)
    } catch (e) {
      reportError(e)
    }
  }

  /** @internal */
  public render(): React.ReactNode {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { engine, ...nativeProps } = this.props
    return <FilamentNativeView ref={this.ref} onViewReady={this.onViewReady} {...nativeProps} />
  }
}
