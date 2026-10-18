import type { HybridObject } from 'react-native-nitro-modules'

/**
 * Image-based lighting loaded from a KTX file with `Engine.loadIndirectLight()`. Apply it with
 * `Scene.setIndirectLight()`.
 */
export interface IndirectLight extends HybridObject<{ ios: 'c++'; android: 'c++' }> {}
