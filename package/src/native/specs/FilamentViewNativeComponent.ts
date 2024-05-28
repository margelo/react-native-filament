import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'
import type { HostComponent, ViewProps } from 'react-native'
import type { DirectEventHandler, Float } from 'react-native/Libraries/Types/CodegenTypes'
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands'
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes'

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

export type FilamentViewNativeType = HostComponent<NativeProps>

export default codegenNativeComponent<NativeProps>('FilamentView') as FilamentViewNativeType

export interface FilamentViewNativeCommands {
  // TODO: implement linking choreographer / is this really still needed?
  // setChoreographer: (viewRef: React.ElementRef<ComponentType>, choreographer: UnsafeObject) => void
  getSurfaceProvider: (viewRef: React.ElementRef<FilamentViewNativeType>) => Float
}

export const FilamentViewCommands: FilamentViewNativeCommands = codegenNativeCommands<FilamentViewNativeCommands>({
  supportedCommands: ['getSurfaceProvider'],
})
