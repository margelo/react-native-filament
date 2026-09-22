import { codegenNativeComponent, type HostComponent, type ViewProps } from 'react-native'
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
   * @note with `false` the view no longer clears between frames, so the scene needs a {@link Skybox}
   * to paint the background. Without one the previous frames stay visible as trails.
   *
   * @default true
   */
  enableTransparentRendering?: boolean
}

export type FilamentViewNativeType = HostComponent<NativeProps>

export default codegenNativeComponent<NativeProps>('FilamentView') as FilamentViewNativeType
