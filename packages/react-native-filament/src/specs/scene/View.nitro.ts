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
 * Rendering options of one `ViewTarget` or `Recorder`. Every member runs on the render thread. Each
 * `set*Options` call replaces all options of that group; omitted fields take Filament's defaults.
 */
export interface View extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * @default 'fxaa'
   * @thread render
   */
  antiAliasing: AntiAliasing
  /**
   * @default 'temporal'
   * @thread render
   */
  dithering: Dithering
  /**
   * Tone mapping, bloom, anti-aliasing and the other post-processing passes.
   * @default true
   * @thread render
   */
  postProcessing: boolean
  /**
   * @default true
   * @thread render
   */
  shadowing: boolean
  /**
   * @default `'pcf'`, or `'vsm'` on the iOS Simulator, whose Metal reports every PCF depth
   * comparison as shadowed
   * @thread render
   */
  shadowType: ShadowType
  /**
   * @default true
   * @thread render
   */
  screenSpaceRefraction: boolean
  /** @thread render */
  setAmbientOcclusionOptions(options: AmbientOcclusionOptions): void
  /** @thread render */
  setBloomOptions(options: BloomOptions): void
  /** @thread render */
  setTemporalAntiAliasingOptions(options: TemporalAntiAliasingOptions): void
  /** @thread render */
  setDynamicResolutionOptions(options: DynamicResolutionOptions): void
  /**
   * Where a world position appears in the view, in points from the top-left corner, using the
   * view's current camera.
   * @thread render
   */
  projectWorldToScreen(position: Float3): Float2
}
