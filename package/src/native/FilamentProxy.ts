import { FilamentBuffer } from './FilamentBuffer'
import { FilamentNativeModule } from './FilamentNativeModule'
import type { Engine } from '../types/Engine'
import { FilamentView } from './FilamentViewTypes'
import type { BulletAPI } from '../bullet/types/api'

interface TestHybridObject {
  int: number
  string: string
  nullableString: string | undefined

  multipleArguments(first: number, second: boolean, third: string): Record<string, number>
  getIntGetter(): () => number
  sayHelloCallback(callback: () => string): void
  createNewHybridObject: () => TestHybridObject
  calculateFibonacciAsync: (count: number) => Promise<BigInt>
  calculateFibonacci: (count: number) => number
  enum: 'first' | 'second' | 'third'
}

export interface TFilamentProxy {
  /**
   * Asynchronously loads the the given asset into a ByteBuffer.
   * @param path A web URL (http:// or https://), local file (file://) or resource ID. (Only resource ID supported for now)
   */
  loadAsset(path: string): Promise<FilamentBuffer>
  /**
   * @private
   */
  createTestObject(): TestHybridObject
  /**
   * @private
   */
  findFilamentView(viewTag: number): Promise<FilamentView>

  /**
   * Creates a new engine. You should only call this once.
   */
  createEngine(): Engine

  /**
   * Creates the bullet API wrapper.
   * @private
   */
  createBullet(): BulletAPI
}

// Check if we are running on-device (JSI)
// @ts-expect-error JSI functions aren't typed
if (global.nativeCallSyncHook == null) {
  throw new Error(
    'Failed to initialize react-native-filament: React Native is not running on-device. Filament can only be used when synchronous method invocations (JSI) are possible. If you are using a remote debugger (e.g. Chrome), switch to an on-device debugger (e.g. Flipper) instead.'
  )
}

// TODO(hanno): Figure out how to call the native install method. I couldn't get codegen to properly generate that static method.
// In Bridge architecture there was a separate Module and View, but now it's all a View - how do I add static methods on that?
// Maybe we need to create a separate FilamentModule as well (in addition to the FilamentView).
const successful = FilamentNativeModule.install()
if (!successful) {
  throw new Error(
    'Failed to initialize react-native-filament! The install() method returned false - check the native logs (adb logcat or Xcode logs) for more information.'
  )
}

// @ts-expect-error global is untyped, it's a C++ host-object
const proxy = global.FilamentProxy as TFilamentProxy

if (proxy == null) {
  throw new Error(
    'Failed to initialize react-native-filament. The global proxy instance (global.FilamentProxy) is null. Check the native logs (adb logcat or Xcode logs) for more information.'
  )
}

export const FilamentProxy = proxy
