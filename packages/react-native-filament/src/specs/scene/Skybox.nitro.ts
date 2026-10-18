import type { HybridObject } from 'react-native-nitro-modules'

/**
 * A scene background of one color from `Engine.createSkybox()` or a KTX cubemap from
 * `Engine.loadSkybox()`. Apply it with `Scene.setSkybox()`.
 */
export interface Skybox extends HybridObject<{ ios: 'c++'; android: 'c++' }> {}
