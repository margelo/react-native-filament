export type TemporalAntiAliasingBoxType = 'aabb' | 'aabb-variance'
export type TemporalAntiAliasingBoxClipping = 'accurate' | 'clamp' | 'none'
export type TemporalAntiAliasingJitterPattern = 'rgss-x4' | 'uniform-helix-x4' | 'halton-23-x8' | 'halton-23-x16' | 'halton-23-x32'

/** Temporal anti-aliasing. Omitted fields take Filament's defaults. */
export interface TemporalAntiAliasingOptions {
  /** @default false */
  enabled?: boolean
  /** @default 1 */
  filterWidth?: number
  /** History weight, lower is smoother. @default 0.12 */
  feedback?: number
  /** @default -1 */
  lodBias?: number
  /** @default 0 */
  sharpness?: number
  /** Upscaling factor from 1 (off) to 2. @default 1 */
  upscaling?: number
  /** @default true */
  filterHistory?: boolean
  /** @default true */
  filterInput?: boolean
  /** @default false */
  useYCoCg?: boolean
  /** @default true */
  hdr?: boolean
  /** @default 'aabb' */
  boxType?: TemporalAntiAliasingBoxType
  /** @default 'accurate' */
  boxClipping?: TemporalAntiAliasingBoxClipping
  /** @default 'halton-23-x16' */
  jitterPattern?: TemporalAntiAliasingJitterPattern
  /** @default 1 */
  varianceGamma?: number
  /** @default false */
  preventFlickering?: boolean
  /** @default true */
  historyReprojection?: boolean
}
