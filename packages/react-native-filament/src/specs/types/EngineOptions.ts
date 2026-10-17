import type { EngineBackend } from './EngineBackend'

export interface EngineOptions {
  /**
   * Graphics API to render with. Defaults to the first entry of `Filament.supportedBackends`.
   */
  backend?: EngineBackend
}
