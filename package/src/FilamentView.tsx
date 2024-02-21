import React from 'react'
import { findNodeHandle, NativeMethods } from 'react-native'
import { FilamentProxy } from './native/FilamentProxy'
import { FilamentNativeView, NativeProps } from './native/FilamentNativeView'

type FilamentViewProps = NativeProps

type RefType = React.Component<NativeProps> & Readonly<NativeMethods>

console.log('loading..')
console.log('model: ' + FilamentProxy.loadModel('test!'))

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
    setTimeout(() => {
      // TODO(hanno): Create types for all the things you expose as HybridObjects.
      const view = FilamentProxy.findFilamentView(this.handle)
      const surfaceProvider = view.getSurfaceProvider()
      const surface = surfaceProvider.getSurface()
      console.log('Surface Width: ' + surface.getWidth())
    }, 1500)
  }

  /** @internal */
  public render(): React.ReactNode {
    return <FilamentNativeView ref={this.ref} {...this.props} />
  }
}
