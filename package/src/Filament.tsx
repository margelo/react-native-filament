import React from 'react'
import { findNodeHandle, NativeMethods } from 'react-native'
import { FilamentProxy } from './native/FilamentProxy'
import { FilamentNativeView, NativeProps } from './native/FilamentNativeView'
import { reportFatalError, reportWorkletError } from './ErrorUtils'
import { FilamentContext } from './FilamentContext'
import { Choreographer, RenderCallback } from 'react-native-filament'
import { Surface, SurfaceProvider } from './native/FilamentViewTypes'
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
  // The creation of the Choreographer is async, so we store it in a promise:
  private readonly choreographer: Promise<Choreographer>
  private resolveChoreographer: (value: Choreographer) => void = () => {
    throw new Error('Internal error: Choreographer creation promise is not initialized yet. This should never happen!')
  }
  private surfaceCreatedListener: Listener | undefined

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

    this.choreographer = new Promise<Choreographer>((resolve) => {
      this.resolveChoreographer = resolve
    })
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

  private updateRenderCallback = async (callback: RenderCallback) => {
    const { engine, _workletContext } = this.getContext()

    const choreographer = await this.choreographer

    _workletContext.runAsync(() => {
      'worklet'
      choreographer.setFrameCallback((frameInfo) => {
        'worklet'

        try {
          callback(frameInfo)
          engine.render(frameInfo.timestamp)
        } catch (e) {
          reportWorkletError(e)
        }
      })
    })
  }

  private createAndSetChoreographer = async () => {
    const { _workletContext } = this.getContext()

    // Create the choreographer in the worklet context, so its frame callback can be called from the worklet thread:
    _workletContext
      .runAsync(() => {
        'worklet'
        return FilamentProxy.createChoreographer()
      })
      .then((choreographer) => {
        this.resolveChoreographer(choreographer)
      })
    // TODO: Catch doesn't work with the promise returned by RNWC
    // .catch((e) => {
    //   console.error('Failed to create Choreographer:', e)
    //   rejectChoreographer()
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

    // Create the Choreographer and set the render callback once done:
    this.createAndSetChoreographer().then(() => {
      this.updateRenderCallback(this.props.renderCallback)
    })
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
    this.surfaceCreatedListener?.remove()
    this.choreographer.then((choreographer) => {
      choreographer.stop()
      choreographer.release()
    })
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
    const { engine, _workletContext } = this.getContext()
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
    const choreographer = await this.choreographer
    choreographer.start()
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
