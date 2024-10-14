import { HybridObject } from 'react-native-nitro-modules'

/**
 * Represents a holder of any native pointer.
 *
 * The native reference can be explicitly deleted via {@linkcode release()},
 * or implicitly when the JS garbage collector runs.
 *
 * Instances of {@linkcode PointerHolder} are always backed by a `jsi::HostObject`.
 */
export interface PointerHolder extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Manually release this reference to the native pointer.
   * This will ensure that JS will no longer hold a strong reference,
   * and memory can be safely cleaned up.
   *
   * If the native pointer is still referenced elsewhere in native code,
   * the underlying memory will not be deleted unless the other references
   * are also released.
   *
   * If this is not called, the memory will only be cleaned once the
   * JS gabage collector decides to delete this object, which might be
   * at any point in the future.
   *
   * Calling `release()` is not _required_ as the GC will destroy this
   * object eventually anyways, but it is _recommended_ to optimize
   * memory usage.
   *
   * After manually releasing a pointer, all future methods on this
   * object will throw an Error.
   */
  release(): void
  /**
   * Get if the refernce to the native pointer is still valid and strong.
   *
   * If this is `false`, this object has been manually released with
   * {@linkcode release}() and all other methods on this object will throw an Error.
   */
  readonly isValid: boolean
}
