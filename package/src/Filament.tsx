import React from 'react'
import { findNodeHandle, NativeMethods } from 'react-native'
import { FilamentProxy } from './native/FilamentProxy'
import { FilamentNativeView, NativeProps } from './native/FilamentNativeView'
import { reportFatalError, reportWorkletError } from './ErrorUtils'
import { FilamentContext } from './FilamentContext'
import { RenderCallback, SwapChain } from 'react-native-filament'
import { FilamentView, SurfaceProvider } from './native/FilamentViewTypes'
import { Listener } from './types/Listener'

type PublicNativeProps = Omit<NativeProps, 'onViewReady'>

export interface FilamentProps extends PublicNativeProps {
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
  private renderCallbackListener: Listener | undefined
  private swapChain: SwapChain | undefined
  private view: FilamentView | undefined

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

  private latestToken = 0
  private updateRenderCallback = async (callback: RenderCallback, swapChain: SwapChain) => {
    const currentToken = ++this.latestToken
    const { renderer, view, workletContext, _choreographer } = this.getContext()

    // When requesting to update the render callback we have to assume that the previous one is not valid anymore
    // ie. its pointing to already released resources from useDisposableResource:
    this.renderCallbackListener?.remove()

    // Adding a new render callback listener is an async operation
    const listener = await workletContext.runAsync(() => {
      'worklet'

      // We need to create the function we pass to addFrameCallbackListener on the worklet thread, so that the
      // underlying JSI function is owned by that thread. Only then can we call it on the worklet thread when
      // the choreographer is calling its listeners.
      return _choreographer.addFrameCallbackListener((frameInfo) => {
        'worklet'
        try {
          callback(frameInfo)
          if (renderer.beginFrame(swapChain, frameInfo.timestamp)) {
            renderer.render(view)
            renderer.endFrame()
          }
        } catch (e) {
          reportWorkletError(e)
        }
      })
    })

    // As setting the listener is async, we have to check updateRenderCallback was called meanwhile.
    // In that case we have to assume that the listener we just set is not valid anymore:
    if (currentToken !== this.latestToken) {
      listener.remove()
      return
    }

    this.renderCallbackListener = listener
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
    if (prevProps.renderCallback !== this.props.renderCallback && this.swapChain != null) {
      // Note: if swapChain was null, the renderCallback will be set/updated in onSurfaceCreated, which uses the latest renderCallback prop
      console.log('Updating render callback')
      this.updateRenderCallback(this.props.renderCallback, this.swapChain)
    }
  }

  /**
   * Calling this signals that this FilamentView will be removed, and it should release all its resources and listeners.
   */
  cleanupResources() {
    const { _choreographer } = this.getContext()
    _choreographer.stop()

    this.renderCallbackListener?.remove()
    this.swapChain?.release()
    this.swapChain = undefined // Note: important to set it to undefined, as this might be called twice (onSurfaceDestroyed and componentWillUnmount), and we can only release once

    // Unlink the view from the choreographer. The native view might be destroyed later, after another FilamentView is created using the same choreographer (and then it would stop the rendering)
    this.view?.setChoreographer(undefined)
  }

  componentWillUnmount(): void {
    this.surfaceCreatedListener?.remove()
    this.surfaceDestroyedListener?.remove()
    this.cleanupResources()
  }

  // This registers the surface provider, which will be notified when the surface is ready to draw on:
  private onViewReady = async () => {
    console.log('On view ready')
    const context = this.getContext()
    try {
      const handle = this.handle
      this.view = await FilamentProxy.findFilamentView(handle)
      if (this.view == null) {
        throw new Error(`Failed to find FilamentView #${handle}!`)
      }
      // Link the view with the choreographer.
      // When the view gets destroyed, the choreographer will be stopped.
      this.view.setChoreographer(context._choreographer)

      const surfaceProvider = this.view.getSurfaceProvider()
      this.surfaceCreatedListener = surfaceProvider.addOnSurfaceCreatedListener(() => {
        this.onSurfaceCreated(surfaceProvider)
      }, FilamentProxy.getCurrentDispatcher())
      this.surfaceDestroyedListener = surfaceProvider.addOnSurfaceDestroyedListener(() => {
        this.onSurfaceDestroyed()
      }, FilamentProxy.getCurrentDispatcher())
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
  private onSurfaceCreated = async (surfaceProvider: SurfaceProvider) => {
    const { engine, workletContext, _choreographer } = this.getContext()
    console.log('On surface created')
    // Create a swap chain …
    const enableTransparentRendering = this.props.enableTransparentRendering ?? true
    this.swapChain = await workletContext.runAsync(() => {
      'worklet'
      return engine.createSwapChainForSurface(surfaceProvider, enableTransparentRendering)
    })
    // Apply the swapchain to the engine …
    engine.setSwapChain(this.swapChain)

    // Set the render callback in the choreographer:
    const { renderCallback } = this.props
    await this.updateRenderCallback(renderCallback, this.swapChain)

    // Start the choreographer …
    _choreographer.start()
  }

  /**
   * On surface destroyed might be called multiple times for the same native view (FilamentView).
   * On android if a surface is destroyed, it can be recreated, while the view stays alive.
   */
  private onSurfaceDestroyed = () => {
    console.log('Surface destroyed')
    const { _choreographer } = this.getContext()
    _choreographer.stop()
    this.cleanupResources()
  }

  /**
   * Pauses the rendering of the Filament view.
   */
  public pause = (): void => {
    const { _choreographer } = this.getContext()
    _choreographer.stop()
  }

  /**
   * Resumes the rendering of the Filament view.
   * It's a no-op if the rendering is already running.
   */
  public resume = (): void => {
    const { _choreographer } = this.getContext()
    _choreographer.start()
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
