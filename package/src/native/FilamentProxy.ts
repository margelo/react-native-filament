import { FilamentBuffer } from '../types/FilamentBuffer.nitro'
import type { Engine } from '../types/Engine.nitro'
import { FilamentView } from './FilamentViewTypes.nitro'
import type { BulletAPI } from '../bullet/types/api'
import type { IWorkletContext } from 'react-native-worklets-core'
import { EngineBackend, EngineConfig } from '../types'
import { TFilamentRecorder } from '../types/FilamentRecorder.nitro'
import { Choreographer } from '../types/Choreographer.nitro'
import { Dispatcher } from './Dispatcher'
import { FilamentModule } from './FilamentModule'
import { Worklets } from 'react-native-worklets-core'

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
  createEngine(backend: EngineBackend | undefined, config: EngineConfig | undefined): Engine

  /**
   * Creates the bullet API wrapper.
   * @private
   */
  createBullet(): BulletAPI

  /**
   * Creates a Dispatcher interface that can dispatch to the current JS Runtime.
   *
   * @throws If the current JS Runtime does not have a Dispatcher.
   * This may happen if a JS Runtime was not created by Filament
   */
  getCurrentDispatcher(): Dispatcher

  /**
   * Creates a Filament Recorder instance that can be used to render offscreen and
   * record to a video file.
   * @param width The width of the target video and the target scene.
   * @param height The height of the target video and the target scene.
   * @param fps The FPS of the rendered video. Offscreen rendering does not happen at the same
   * FPS rate as set here, but the resulting video will be displayed at this rate.
   * @param bitRate The target bit-rate of the video, in bits per second. For example, 2_000_000 is 2 Mbps.
   */
  createRecorder(width: number, height: number, fps: number, bitRate: number): TFilamentRecorder

  /**
   * Whether Worklets are installed, or not.
   */
  readonly hasWorklets: boolean

  /**
   * Create a Worklet context used for Rendering to Filament.
   *
   * This should only be called once, and the returned value should be kept strong.
   *
   * @example
   * ```ts
   * // 1. Get Render-Thread Worklet Context
   * const context = FilamentProxy.createWorkletContext()
   *
   * // 2. From now on, perform all Filament calls and operations in `context`
   * context.runAsync(() => {
   *   const engine = FilamentProxy.createEngine()
   *   // render...
   * })
   * ```
   */
  createWorkletContext: () => IWorkletContext

  createChoreographer(): Choreographer
}

const successful = FilamentModule.install()
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

if (!proxy.hasWorklets) {
  throw new Error(
    'Failed to initialize react-native-filament - Worklets are not available (HAS_WORKLETS=false), did you install react-native-worklets-core?'
  )
}

export const FilamentProxy = proxy

// We must make sure that the Worklets API (module) is initialized (as its possible a lazy-loaded CxxTurboModule),
// to initialize we must only call any property of the module:
Worklets.defaultContext

// Create our custom RNF worklet context:
export const FilamentWorkletContext = proxy.createWorkletContext()
