import { type HybridObject } from 'react-native-nitro-modules'

export interface SwapChain extends HybridObject<{ android: 'c++'; ios: 'c++' }> {
  // TODO: Inheritance is not yet supported by nitrogen
  release(): void
}
