import type { AmbientOcclusionOptions } from '../specs/types/AmbientOcclusionOptions'
import type { AntiAliasing } from '../specs/types/AntiAliasing'
import type { BloomOptions } from '../specs/types/BloomOptions'
import type { Dithering } from '../specs/types/Dithering'
import type { DynamicResolutionOptions } from '../specs/types/DynamicResolutionOptions'
import type { ShadowType } from '../specs/types/ShadowType'
import type { TemporalAntiAliasingOptions } from '../specs/types/TemporalAntiAliasingOptions'

/** Rendering options of one view. An omitted option keeps the view's default. */
export interface ViewOptions {
  antiAliasing?: AntiAliasing
  dithering?: Dithering
  postProcessing?: boolean
  shadowing?: boolean
  shadowType?: ShadowType
  screenSpaceRefraction?: boolean
  ambientOcclusionOptions?: AmbientOcclusionOptions
  bloomOptions?: BloomOptions
  temporalAntiAliasingOptions?: TemporalAntiAliasingOptions
  dynamicResolutionOptions?: DynamicResolutionOptions
}
