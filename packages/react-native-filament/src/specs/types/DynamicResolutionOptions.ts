import type { Float2 } from './Float2'
import type { QualityLevel } from './QualityLevel'

/** Scales the render resolution with GPU load. Omitted fields take Filament's defaults. */
export interface DynamicResolutionOptions {
  /** @default false */
  enabled?: boolean
  /** @default false */
  homogeneousScaling?: boolean
  /** @default [0.5, 0.5] */
  minScale?: Float2
  /** @default [1, 1] */
  maxScale?: Float2
  /** @default 0.9 */
  sharpness?: number
  /** @default 'low' */
  quality?: QualityLevel
}
