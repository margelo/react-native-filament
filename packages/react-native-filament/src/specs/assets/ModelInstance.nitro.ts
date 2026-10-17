import type { HybridObject } from 'react-native-nitro-modules'
import type { Entity } from '../types/Entity'
import type { Animator } from './Animator.nitro'

export interface ModelInstance extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly rootEntity: Entity
  /** @thread any */
  readonly entities: Entity[]
  /** @thread any */
  readonly animator: Animator
}
