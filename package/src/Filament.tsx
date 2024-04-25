import React from 'react'
import { findNodeHandle, NativeMethods } from 'react-native'
import { FilamentProxy } from './native/FilamentProxy'
import { FilamentNativeView, NativeProps } from './native/FilamentNativeView'
import { reportFatalError } from './ErrorUtils'
import { FilamentContext } from './FilamentContext'

export interface FilamentProps extends NativeProps {}

type RefType = React.Component<NativeProps> & Readonly<NativeMethods>

export class Filament extends React.PureComponent<FilamentProps> {
  private readonly ref: React.RefObject<RefType>
  static contextType = FilamentContext
  // @ts-ignore
  context!: React.ContextType<typeof FilamentContext>

  constructor(props: FilamentProps) {
    super(props)
    this.ref = React.createRef<RefType>()
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
    if (this.context == null) {
      throw new Error('Filament component must be used within a FilamentProvider!')
    }

    try {
      const handle = this.handle
      const view = await FilamentProxy.findFilamentView(handle)
      if (view == null) {
        throw new Error(`Failed to find FilamentView #${handle}!`)
      }
      const surfaceProvider = view.getSurfaceProvider()
      // Link the surface with the engine:
      const engine = this.context.engine
      this.context._workletContext.runAsync(() => {
        'worklet'
        engine.setSurfaceProvider(surfaceProvider)
      })
    } catch (e) {
      reportFatalError(e)
    }
  }

  /** @internal */
  public render(): React.ReactNode {
    return <FilamentNativeView ref={this.ref} onViewReady={this.onViewReady} {...this.props} />
  }
}
