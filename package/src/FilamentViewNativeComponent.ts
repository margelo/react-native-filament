import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'
import type { ViewProps } from 'react-native'

interface NativeProps extends ViewProps {
  color?: string
}

export const FilamentViewNativeComponent = codegenNativeComponent<NativeProps>('FilamentView')
