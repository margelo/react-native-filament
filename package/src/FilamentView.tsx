import React from 'react'
import { findNodeHandle, NativeMethods, Platform } from 'react-native'
import { FilamentProxy } from './native/FilamentProxy'
import { FilamentNativeView, NativeProps } from './native/FilamentNativeView'

type FilamentViewProps = NativeProps

type RefType = React.Component<NativeProps> & Readonly<NativeMethods>

export class FilamentView extends React.PureComponent<FilamentViewProps> {
  private readonly ref: React.RefObject<RefType>
  private readonly engine = FilamentProxy.createEngine()

  constructor(props: FilamentViewProps) {
    super(props)
    this.ref = React.createRef<RefType>()

    this.setup3dScene()
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
      this.setupSurface()
    }, 100)
  }

  setup3dScene = () => {
    // Load a model into the scene:
    const modelPath = Platform.select({
      android: 'custom/pengu.glb',
      ios: 'pengu.glb',
    })
    const modelBuffer = FilamentProxy.getAssetByteBuffer(modelPath!)
    this.engine.loadAsset(modelBuffer)

    // Create a default light:
    const indirectLightPath = Platform.select({
      android: 'custom/default_env_ibl.ktx',
      ios: 'default_env_ibl.ktx',
    })
    const indirectLightBuffer = FilamentProxy.getAssetByteBuffer(indirectLightPath!)
    this.engine.setIndirectLight(indirectLightBuffer)

    // Create a directional light for supporting shadows
    const light = this.engine.createLightEntity('directional', 6500, 10000, 0, -1, 0, true)
    this.engine.getScene().addEntity(light)
  }

  renderCallback = () => {
    this.engine.getCamera().lookAt(this.engine.getCameraManipulator())
  }

  setupSurface = () => {
    // Get Surface:
    const fView = FilamentProxy.findFilamentView(this.handle)
    const surfaceProvider = fView.getSurfaceProvider()

    // Link the surface with the engine:
    this.engine.setSurfaceProvider(surfaceProvider)

    // Callback for rendering every frame
    this.engine.setRenderCallback(this.renderCallback)
  }

  /** @internal */
  public render(): React.ReactNode {
    return <FilamentNativeView ref={this.ref} {...this.props} />
  }
}
