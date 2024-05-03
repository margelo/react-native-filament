import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'
import type { HostComponent, ViewProps } from 'react-native'

export interface NativeProps extends ViewProps {
  /**
   * Called when the native view has been attached to the window.
   */
  onViewReady?: () => void

  /**
   * Called once the native view's underlying surface is ready to be drawn on.
   */
  onSurfaceCreated?: () => void

  /**
   * Every pixel of the view that is not covered by the Filament scene will be transparent.
   *
   * @note if you use a skybox you should disable this feature.
   *
   * @default true
   */
  enableTransparentRendering?: boolean
}

export const FilamentNativeView = codegenNativeComponent<NativeProps>('FilamentView') as HostComponent<NativeProps>
