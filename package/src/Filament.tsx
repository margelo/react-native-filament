import React from 'react'
import { findNodeHandle, NativeMethods } from 'react-native'
import { FilamentProxy } from './native/FilamentProxy'
import { FilamentNativeView, NativeProps } from './native/FilamentNativeView'
import { reportFatalError, reportWorkletError } from './ErrorUtils'
import { FilamentContext } from './FilamentContext'
import { RenderCallback } from 'react-native-filament'
import { SurfaceProvider } from './native/FilamentViewTypes'
import { Listener } from './types/Listener'

export interface FilamentProps extends NativeProps {
  /**
   * This function will be called every frame. You can use it to update your scene.
   *
   * @note Don't call any methods on `engine` here - this will lead to deadlocks!
   */
  renderCallback: RenderCallback
}

type RefType = React.Component<NativeProps> & Readonly<NativeMethods>

export class Filament extends React.PureComponent<FilamentProps> {
  private readonly ref: React.RefObject<RefType>
  private surfaceCreatedListener: Listener | undefined
  private surfaceDestroyedListener: Listener | undefined

  /**
   * Uses the context in class.
   * @note Not available in the constructor!
   */
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

  private updateTransparentRendering = (enable: boolean) => {
    const { renderer } = this.getContext()
    renderer.setClearContent(enable)
  }

  private updateRenderCallback = (callback: RenderCallback) => {
    // const { engine, _workletContext, _choreographer } = this.getContext()
    // _workletContext.runAsync(() => {
    //   'worklet'
    //   _choreographer.setFrameCallback((frameInfo) => {
    //     'worklet'
    //     try {
    //       callback(frameInfo)
    //       engine.render(frameInfo.timestamp)
    //     } catch (e) {
    //       reportWorkletError(e)
    //     }
    //   })
    // })
  }

  private getContext = () => {
    if (this.context == null) {
      throw new Error('Filament component must be used within a FilamentProvider!')
    }

    return this.context
  }

  componentDidMount(): void {
    // Setup transparency mode:
    if (!this.props.enableTransparentRendering) {
      this.updateTransparentRendering(false)
    }
  }

  componentDidUpdate(prevProps: Readonly<FilamentProps>): void {
    if (prevProps.enableTransparentRendering !== this.props.enableTransparentRendering) {
      this.updateTransparentRendering(this.props.enableTransparentRendering ?? true)
    }
    if (prevProps.renderCallback !== this.props.renderCallback) {
      this.updateRenderCallback(this.props.renderCallback)
    }
  }

  componentWillUnmount(): void {
    const { _choreographer } = this.getContext()
    this.surfaceCreatedListener?.remove()
    this.surfaceDestroyedListener?.remove()
    _choreographer.stop()
  }

  // This registers the surface provider, which will be notified when the surface is ready to draw on:
  onViewReady = async () => {
    console.log('On view ready')
    const context = this.getContext()

    try {
      const handle = this.handle
      const view = await FilamentProxy.findFilamentView(handle)
      if (view == null) {
        throw new Error(`Failed to find FilamentView #${handle}!`)
      }
      const surfaceProvider = view.getSurfaceProvider()

      this.surfaceCreatedListener = surfaceProvider.addOnSurfaceCreatedListener(() => {
        console.log('Surface created!')
        this.onSurfaceCreated(surfaceProvider)
      })

      this.surfaceDestroyedListener = surfaceProvider.addOnSurfaceDestroyedListener(() => {
        console.log('Surface destroyed!')
        this.onSurfaceDestroyed()
      })

      // Link the surface with the engine:
      console.log('Setting surface provider')
      context.engine.setSurfaceProvider(surfaceProvider)

      // Its possible that the surface is already created, then our callback wouldn't be called
      // (we still keep the callback as on android a surface can be destroyed and recreated, while the view stays alive)
      if (surfaceProvider.getSurface() != null) {
        console.log('Surface already created!')
        this.onSurfaceCreated(surfaceProvider)
      }
    } catch (e) {
      reportFatalError(e)
    }
  }

  // This will be called once the surface is created and ready to draw on:
  onSurfaceCreated = async (surfaceProvider: SurfaceProvider) => {
    const { engine, _workletContext, _choreographer } = this.getContext()
    console.log('On surface created')

    // Create a swap chain …
    const enableTransparentRendering = this.props.enableTransparentRendering ?? true
    const swapChain = await _workletContext.runAsync(() => {
      'worklet'
      return engine.createSwapChainForSurface(surfaceProvider, enableTransparentRendering)
    })

    // Apply the swapchain to the engine …
    engine.setSwapChain(swapChain)
    // Start the choreographer …
    _choreographer.start()
  }

  onSurfaceDestroyed = () => {
    console.log('Stopping choreographer')
    const { _choreographer } = this.getContext()
    _choreographer.stop()
  }

  /** @internal */
  public render(): React.ReactNode {
    return <FilamentNativeView ref={this.ref} onViewReady={this.onViewReady} {...this.props} />
  }
}

// @ts-expect-error Not in the types
Filament.defaultProps = {
  enableTransparentRendering: true,
}
