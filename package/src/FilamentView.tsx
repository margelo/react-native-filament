import React from 'react'
import { findNodeHandle, NativeMethods, Platform } from 'react-native'
import { FilamentProxy } from './native/FilamentProxy'
import { FilamentNativeView, NativeProps } from './native/FilamentNativeView'
import type { Float3 } from './types/float3'
import { Animator } from './types/Animator'

type FilamentViewProps = NativeProps

type RefType = React.Component<NativeProps> & Readonly<NativeMethods>

const penguModelPath = Platform.select({
  android: 'custom/pengu.glb',
  ios: 'pengu.glb',
})!

const indirectLightPath = Platform.select({
  android: 'custom/default_env_ibl.ktx',
  ios: 'default_env_ibl.ktx',
})!

export class FilamentView extends React.PureComponent<FilamentViewProps> {
  private readonly ref: React.RefObject<RefType>
  private readonly engine = FilamentProxy.createEngine()
  private animator: Animator | null = null

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
    const modelBuffer = FilamentProxy.getAssetByteBuffer(penguModelPath)
    const penguAsset = this.engine.loadAsset(modelBuffer)
    this.animator = penguAsset.getAnimator()
    penguAsset.releaseSourceData() // Cleanup memory after loading the asset

    // By default all assets get added to the origin at 0,0,0,
    // we transform it to fit into a unit cube at the origin using this utility:
    this.engine.transformToUnitCube(penguAsset)

    // Create a default light:
    const indirectLightBuffer = FilamentProxy.getAssetByteBuffer(indirectLightPath)
    this.engine.setIndirectLight(indirectLightBuffer)

    // Create a directional light for supporting shadows
    const light = this.engine.createLightEntity('directional', 6500, 10000, 0, -1, 0, true)
    this.engine.getScene().addEntity(light)
  }

  renderCallback = (_timestamp: number, _startTime: number, passedSeconds: number) => {
    const cameraPosition: Float3 = [0, 0, 5]
    const cameraTarget: Float3 = [0, 0, 0]
    const cameraUp: Float3 = [0, 1, 0]

    if (this.animator) {
      this.animator.applyAnimation(0, passedSeconds)
      this.animator.updateBoneMatrices()
    }

    this.engine.getCamera().lookAt(cameraPosition, cameraTarget, cameraUp)
  }

  setupSurface = () => {
    // Get Surface:
    const fView = FilamentProxy.findFilamentView(this.handle)
    const surfaceProvider = fView.getSurfaceProvider()

    // Link the surface with the engine:
    this.engine.setSurfaceProvider(surfaceProvider)

    // Configure camera lens (Important, do so after linking the surface)
    const view = this.engine.getView()
    const aspectRatio = view.aspectRatio
    const focalLengthInMillimeters = 28
    const near = 0.1
    const far = 1000
    this.engine.getCamera().setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
    console.log('aspectRatio', aspectRatio)
    // Alternatively setProjection can be used

    // Callback for rendering every frame
    this.engine.setRenderCallback(this.renderCallback)
  }

  /** @internal */
  public render(): React.ReactNode {
    return <FilamentNativeView ref={this.ref} {...this.props} />
  }
}
