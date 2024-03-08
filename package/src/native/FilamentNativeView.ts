import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'
import type { ViewProps } from 'react-native'

export interface NativeProps extends ViewProps {
  onViewReady?: () => void
}

export const FilamentNativeView = codegenNativeComponent<NativeProps>('FilamentView')
