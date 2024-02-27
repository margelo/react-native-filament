import React from 'react'
import { findNodeHandle, NativeMethods } from 'react-native'
import { FilamentProxy, Listener } from './native/FilamentProxy'
import { FilamentNativeView, NativeProps } from './native/FilamentNativeView'

type FilamentViewProps = NativeProps

type RefType = React.Component<NativeProps> & Readonly<NativeMethods>

export class FilamentView extends React.PureComponent<FilamentViewProps> {
  private readonly ref: React.RefObject<RefType>
  private readonly choreographer = FilamentProxy.createChoreographer()
  private choreographerListener: Listener | null = null

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
    // TODO: lets get rid of this timeout
    setTimeout(() => {
      this.setup3dScene()
    }, 100)
  }

  componentWillUnmount(): void {
    this.choreographer.stop()
    if (this.choreographerListener != null) {
      this.choreographerListener.remove()
    }
  }

  setup3dScene = () => {
    // Get Surface:
    const fView = FilamentProxy.findFilamentView(this.handle)
    const surfaceProvider = fView.getSurfaceProvider()

    // Create engine:
    const engine = FilamentProxy.createEngine()

    // Load a model into the scene:
    const modelBuffer = FilamentProxy.getAssetByteBuffer('pengu.glb')
    engine.loadAsset(modelBuffer)

    // Create a default light:
    const indirectLightBuffer = FilamentProxy.getAssetByteBuffer('default_env_ibl.ktx')
    engine.createDefaultLight(indirectLightBuffer)

    // Link the surface with the engine:
    engine.setSurfaceProvider(surfaceProvider)

    // Callback for rendering every frame
    engine.setRenderCallback(() => {
      engine.getCamera().lookAt(engine.getCameraManipulator())
    })
  }

  /** @internal */
  public render(): React.ReactNode {
    return <FilamentNativeView ref={this.ref} {...this.props} />
  }
}
