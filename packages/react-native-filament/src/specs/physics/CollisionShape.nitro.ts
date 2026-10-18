import type { HybridObject } from 'react-native-nitro-modules'
import type { CollisionShapeType } from '../types/CollisionShapeType'
import type { Float3 } from '../types/Float3'

/** A shape that rigid bodies share. It lives as long as a body or JS uses it. */
export interface CollisionShape extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly type: CollisionShapeType
  /** @thread render */
  localScaling: Float3
  /** Collision margin in meters. @thread render */
  margin: number
}
