import type { QualityLevel } from './QualityLevel'

export type AmbientOcclusionType = 'sao' | 'gtao'

/** Screen-space ambient occlusion. Omitted fields take Filament's defaults. */
export interface AmbientOcclusionOptions {
  /** @default false */
  enabled?: boolean
  /** @default 'sao' */
  type?: AmbientOcclusionType
  /** Occlusion radius in meters. @default 0.3 */
  radius?: number
  /** @default 1 */
  power?: number
  /** Self-occlusion bias in meters. @default 0.0005 */
  bias?: number
  /** Resolution scale, 0.5 or 1. @default 0.5 */
  resolution?: number
  /** @default 1 */
  intensity?: number
  /** @default 0.05 */
  bilateralThreshold?: number
  /** @default 'low' */
  quality?: QualityLevel
  /** @default 'medium' */
  lowPassFilter?: QualityLevel
  /** @default 'low' */
  upsampling?: QualityLevel
  /** @default false */
  bentNormals?: boolean
  /** @default 0 */
  minHorizonAngleRadians?: number
}
