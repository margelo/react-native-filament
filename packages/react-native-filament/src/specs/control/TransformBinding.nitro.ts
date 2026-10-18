import type { HybridObject } from 'react-native-nitro-modules'
import type { Mat4 } from '../types/Mat4'

/**
 * Owns the local transform of one entity while it is alive. Setters store the latest value and
 * wake the render thread; the latest translation, rotation and scale are applied together at the
 * start of the next frame. After `dispose()`, setter calls through other references to the binding,
 * such as a copy captured by a UI-runtime listener, are ignored.
 */
export interface TransformBinding extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  setTranslation(x: number, y: number, z: number): void
  /**
   * Unit quaternion.
   * @thread any
   */
  setRotation(x: number, y: number, z: number, w: number): void
  /** @thread any */
  setScale(x: number, y: number, z: number): void
  /**
   * A transform applied before scale, rotation and translation, so the entity's local transform
   * becomes `translation · rotation · scale · base`. @default identity
   * @thread any
   */
  setBase(transform: Mat4): void
}
