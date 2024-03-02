import React from 'react'
import { findNodeHandle, NativeMethods } from 'react-native'
import { FilamentProxy } from './native/FilamentProxy'
import { FilamentNativeView, NativeProps } from './native/FilamentNativeView'
import { Engine, RenderCallback } from './types'

type FilamentViewProps = NativeProps & {
  engine: Engine
  renderCallback: RenderCallback
}

type RefType = React.Component<NativeProps> & Readonly<NativeMethods>

export class FilamentView extends React.PureComponent<FilamentViewProps> {
  private readonly ref: React.RefObject<RefType>

  constructor(props: FilamentViewProps) {
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

  componentDidMount() {
    this.setupSurface()
  }

  setupSurface = () => {
    // Get Surface:
    const fView = FilamentProxy.findFilamentView(this.handle)
    const surfaceProvider = fView.getSurfaceProvider()

    // Link the surface with the engine:
    this.props.engine.setSurfaceProvider(surfaceProvider)
  }

  /** @internal */
  public render(): React.ReactNode {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { engine, renderCallback, ...nativeProps } = this.props
    return <FilamentNativeView ref={this.ref} {...nativeProps} />
  }
}
