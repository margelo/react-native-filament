import { HybridObject } from "react-native-nitro-modules";

export interface Listener extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  remove(): void
}
