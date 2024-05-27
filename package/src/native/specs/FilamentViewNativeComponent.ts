import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'
import type { HostComponent, ViewProps } from 'react-native'
import type { DirectEventHandler } from 'react-native/Libraries/Types/CodegenTypes'

export interface NativeProps extends ViewProps {
  /**
   * Called when the native view has been attached to the window.
   */
  onViewReady: DirectEventHandler<null>

  /**
   * Every pixel of the view that is not covered by the Filament scene will be transparent.
   *
   * @note if you use a skybox you should disable this feature.
   *
   * @default true
   */
  enableTransparentRendering?: boolean
}

export default codegenNativeComponent<NativeProps>('FilamentView') as HostComponent<NativeProps>
