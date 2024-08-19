import { type HybridObject } from 'react-native-nitro-modules'

export interface SwapChain extends HybridObject<{ android: 'c++'; ios: 'c++' }> {
  readonly isValid: boolean
  release(): void
}
