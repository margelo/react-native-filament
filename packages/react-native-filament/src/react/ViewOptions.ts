import type { AmbientOcclusionOptions } from '../specs/types/AmbientOcclusionOptions'
import type { AntiAliasing } from '../specs/types/AntiAliasing'
import type { BloomOptions } from '../specs/types/BloomOptions'
import type { Dithering } from '../specs/types/Dithering'
import type { DynamicResolutionOptions } from '../specs/types/DynamicResolutionOptions'
import type { ShadowType } from '../specs/types/ShadowType'
import type { TemporalAntiAliasingOptions } from '../specs/types/TemporalAntiAliasingOptions'

/** Rendering options of one view. An omitted option keeps the view's default. */
export interface ViewOptions {
  /** @default 'fxaa' */
  antiAliasing?: AntiAliasing
  /** @default 'temporal' */
  dithering?: Dithering
  /** Tone mapping, bloom, anti-aliasing and the other post-processing passes. @default true */
  postProcessing?: boolean
  /** @default true */
  shadowing?: boolean
  /** @default 'pcf', or `'vsm'` on the iOS Simulator */
  shadowType?: ShadowType
  /** @default true */
  screenSpaceRefraction?: boolean
  /** Omitted fields take Filament's defaults. */
  ambientOcclusionOptions?: AmbientOcclusionOptions
  /** Omitted fields take Filament's defaults. */
  bloomOptions?: BloomOptions
  /** Omitted fields take Filament's defaults. */
  temporalAntiAliasingOptions?: TemporalAntiAliasingOptions
  /** Omitted fields take Filament's defaults. */
  dynamicResolutionOptions?: DynamicResolutionOptions
}
