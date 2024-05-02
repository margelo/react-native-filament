import React from 'react'
import { findNodeHandle, NativeMethods } from 'react-native'
import { FilamentProxy } from './native/FilamentProxy'
import { FilamentNativeView, NativeProps } from './native/FilamentNativeView'
import { reportFatalError, reportWorkletError } from './ErrorUtils'
import { FilamentContext } from './FilamentContext'
import { Choreographer, RenderCallback } from 'react-native-filament'

export interface FilamentProps extends NativeProps {
  renderCallback: RenderCallback
}

type RefType = React.Component<NativeProps> & Readonly<NativeMethods>

export class Filament extends React.PureComponent<FilamentProps> {
  private readonly ref: React.RefObject<RefType>
  private readonly choreographer: Choreographer

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
    this.choreographer = FilamentProxy.createChoreographer()
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
    console.log('context?', this.context)
    this.context?.renderer.setClearContent(enable)
  }

  private updateRenderCallback = (callback: RenderCallback) => {
    const { _workletContext } = this.getContext()

    _workletContext.runAsync(() => {
      'worklet'
      this.choreographer.setFrameCallback((...args) => {
        'worklet'

        try {
          callback(...args)
        } catch (e) {
          reportWorkletError(e)
        }
      })
    })
  }

  private getContext = () => {
    if (this.context == null) {
      throw new Error('Filament component must be used within a FilamentProvider!')
    }

    return this.context
  }

  componentDidMount(): void {
    // Set the render callback:
    this.updateRenderCallback(this.props.renderCallback)

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
    this.choreographer.release()
  }

  onViewReady = async () => {
    const context = this.getContext()

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
      const choreographer = this.choreographer
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
