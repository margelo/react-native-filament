import type { QualityLevel } from './QualityLevel'

export type BloomBlendMode = 'add' | 'interpolate'

/** Bloom and lens flare. Omitted fields take Filament's defaults. */
export interface BloomOptions {
  /** @default false */
  enabled?: boolean
  /** @default 0.1 */
  strength?: number
  /** Resolution of the vertical axis of the bloom buffer in pixels. @default 384 */
  resolution?: number
  /** @default 6 */
  levels?: number
  /** @default 'add' */
  blendMode?: BloomBlendMode
  /** @default true */
  threshold?: boolean
  /** @default 1000 */
  highlight?: number
  /** @default 'low' */
  quality?: QualityLevel
  /** @default false */
  lensFlare?: boolean
  /** @default true */
  starburst?: boolean
  /** @default 0.005 */
  chromaticAberration?: number
  /** @default 4 */
  ghostCount?: number
  /** @default 0.6 */
  ghostSpacing?: number
  /** @default 10 */
  ghostThreshold?: number
  /** @default 0.1 */
  haloThickness?: number
  /** @default 0.4 */
  haloRadius?: number
  /** @default 10 */
  haloThreshold?: number
}
