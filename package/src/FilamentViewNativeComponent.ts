import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'
import type { ViewProps } from 'react-native'

export interface NativeProps extends ViewProps {
  model?: number
}

export const NativeFilamentView = codegenNativeComponent<NativeProps>('FilamentView')
