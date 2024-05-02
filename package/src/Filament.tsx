import React from 'react'
import { findNodeHandle, NativeMethods } from 'react-native'
import { FilamentProxy } from './native/FilamentProxy'
import { FilamentNativeView, NativeProps } from './native/FilamentNativeView'
import { reportFatalError, reportWorkletError } from './ErrorUtils'
import { FilamentContext } from './FilamentContext'
import { Choreographer, RenderCallback } from 'react-native-filament'

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
  // private choreographer: Choreographer | undefined
  private readonly waitUntilChoreographer: Promise<Choreographer>
  private waitUntilChoreographerResolve: (value: Choreographer) => void = () => {
    throw new Error('Internal error: waitUntilChoreographerResolve not initialized!')
  }

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

    this.waitUntilChoreographer = new Promise<Choreographer>((resolve) => {
      this.waitUntilChoreographerResolve = resolve
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
    console.log('updateRenderCallback')
    const { engine, _workletContext } = this.getContext()

    const choreographer = await this.waitUntilChoreographer

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
        this.waitUntilChoreographerResolve(choreographer)
      })
    // TODO: Catch doesn't work with the promise returned by RNWC
    // .catch((e) => {
    //   console.error('Failed to create Choreographer:', e)
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

    // Set the render callback:
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
    // TODO: implement release
    // this.choreographer?.release()
    // const choreographer = this.choreographer
  }

  onViewReady = async () => {
    const context = this.getContext()
    const choreographer = await this.waitUntilChoreographer

    try {
      const handle = this.handle
      const view = await FilamentProxy.findFilamentView(handle)
      if (view == null) {
        throw new Error(`Failed to find FilamentView #${handle}!`)
      }
      const surfaceProvider = view.getSurfaceProvider()
      // Link the surface with the engine:
      const engine = context.engine
      const enableTransparentRendering = this.props.enableTransparentRendering ?? true
      context._workletContext.runAsync(() => {
        'worklet'
        engine.setSurfaceProvider(surfaceProvider, enableTransparentRendering)
        choreographer.start()
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

// @ts-expect-error Not in the types
Filament.defaultProps = {
  enableTransparentRendering: true,
}
