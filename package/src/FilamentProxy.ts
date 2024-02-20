import { FilamentViewNativeComponent } from './FilamentViewNativeComponent'

export interface TFilamentProxy {
  /**
   * Loads a 3D Model from the given path.
   * @param path A web URL (http:// or https://), local file (file://) or resource ID.
   */
  loadModel(path: string): number
}

// Check if we are running on-device (JSI)
// @ts-expect-error JSI functions aren't typed
if (global.nativeCallSyncHook == null) {
  throw new Error(
    'Failed to initialize react-native-filament: React Native is not running on-device. Filament can only be used when synchronous method invocations (JSI) are possible. If you are using a remote debugger (e.g. Chrome), switch to an on-device debugger (e.g. Flipper) instead.'
  )
}

// TODO: Figure out how to call the native install method. I couldn't get codegen to properly generate that static method.
const successful = FilamentViewNativeComponent.install()
if (!successful) {
  throw new Error('Failed to initialize react-native-filament! Check the native logs (adb logcat or Xcode logs) for more information.')
}

// @ts-expect-error global is untyped, it's a C++ host-object
const proxy = global.FilamentProxy as TFilamentProxy

if (proxy == null) {
  throw new Error(
    'Failed to initialize react-native-filament. The global proxy instance (global.FilamentProxy) is null. Check the native logs (adb logcat or Xcode logs) for more information.'
  )
}

export const FilamentProxy = proxy
