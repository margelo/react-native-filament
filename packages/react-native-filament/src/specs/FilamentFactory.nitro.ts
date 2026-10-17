import type { HybridObject } from 'react-native-nitro-modules'
import type { EngineBackend } from './types/EngineBackend'
import type { EngineOptions } from './types/EngineOptions'
import type { Engine } from './engine/Engine.nitro'

export interface FilamentFactory extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Version of the linked Filament binaries, for example `"1.78.0"`.
   * @thread any
   */
  readonly filamentVersion: string
  /**
   * Backends this device can create an Engine with, preferred first.
   * @thread any
   */
  readonly supportedBackends: EngineBackend[]
  /**
   * Creates an Engine with its own render thread.
   * @thread any
   */
  createEngine(options: EngineOptions): Promise<Engine>
}
