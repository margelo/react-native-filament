import type { HybridObject } from 'react-native-nitro-modules'
import type { Entity } from '../types/Entity'
import type { LightType } from '../types/LightType'

/**
 * A light entity created with `Engine.createDirectionalLight()`, `createSunLight()`,
 * `createPointLight()`, `createSpotLight()` or `createFocusedSpotLight()`. Change it through
 * `Engine.lightManager`.
 */
export interface Light extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly entity: Entity
  /** @thread any */
  readonly type: LightType
}
