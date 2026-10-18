import type { HybridObject } from 'react-native-nitro-modules'
import type { AmbientOcclusionOptions } from '../types/AmbientOcclusionOptions'
import type { AntiAliasing } from '../types/AntiAliasing'
import type { BloomOptions } from '../types/BloomOptions'
import type { Dithering } from '../types/Dithering'
import type { DynamicResolutionOptions } from '../types/DynamicResolutionOptions'
import type { Float2 } from '../types/Float2'
import type { Float3 } from '../types/Float3'
import type { ShadowType } from '../types/ShadowType'
import type { TemporalAntiAliasingOptions } from '../types/TemporalAntiAliasingOptions'

/**
 * Rendering options of one `ViewTarget`. Every member runs on the render thread. Each
 * `set*Options` call replaces all options of that group; omitted fields take Filament's defaults.
 */
export interface View extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @default 'fxaa' */
  antiAliasing: AntiAliasing
  /** @default 'temporal' */
  dithering: Dithering
  /** Tone mapping, bloom, anti-aliasing and the other post-processing passes. @default true */
  postProcessing: boolean
  /** @default true */
  shadowing: boolean
  /** @default 'pcf' */
  shadowType: ShadowType
  /** @default true */
  screenSpaceRefraction: boolean
  setAmbientOcclusionOptions(options: AmbientOcclusionOptions): void
  setBloomOptions(options: BloomOptions): void
  setTemporalAntiAliasingOptions(options: TemporalAntiAliasingOptions): void
  setDynamicResolutionOptions(options: DynamicResolutionOptions): void
  /**
   * Where a world position appears in the view, in points from the top-left corner, using the
   * view's current camera.
   */
  projectWorldToScreen(position: Float3): Float2
}
