/**
 * Options for screen space Ambient Occlusion (SSAO) and Screen Space Cone Tracing (SSCT)
 */
export interface AmbientOcclusionOptions {
  /**
   * Ambient Occlusion radius in meters, between 0 and ~10.
   * @default 0.3
   */
  radius?: number

  /**
   * Controls ambient occlusion's contrast. Must be positive.
   * @default 1.0
   */
  power?: number

  /**
   * Self-occlusion bias in meters. Use to avoid self-occlusion. Between 0 and a few mm.
   * @default 0.0005
   */
  bias?: number

  /**
   * How each dimension of the AO buffer is scaled. Must be either 0.5 or 1.0.
   * @default 0.5
   */
  resolution?: number

  /**
   * Strength of the Ambient Occlusion effect.
   * @default 1.0
   */
  intensity?: number

  /**
   * Depth distance that constitutes an edge for filtering.
   * @default 0.05
   */
  bilateralThreshold?: number

  /**
   * Affects the number of samples used for AO.
   * @default 'LOW'
   */
  quality?: QualityLevel

  /**
   * Affects AO smoothness.
   * @default 'MEDIUM'
   */
  lowPassFilter?: QualityLevel

  /**
   * Affects AO buffer upsampling quality.
   * @default 'LOW'
   */
  upsampling?: QualityLevel

  /**
   * Enables or disables screen-space ambient occlusion.
   * @default false
   */
  enabled?: boolean

  /**
   * Enables bent normals computation from AO, and specular AO.
   * @default false
   */
  bentNormals?: boolean

  /**
   * Minimum angle in radians to consider.
   * @default 0.0
   */
  minHorizonAngleRad?: number
}

export type QualityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA'

/**
 * Dynamic resolution can be used to either reach a desired target frame rate
 * by lowering the resolution of a View, or to increase the quality when the
 * rendering is faster than the target frame rate.
 *
 * This structure can be used to specify the minimum scale factor used when
 * lowering the resolution of a View, and the maximum scale factor used when
 * increasing the resolution for higher quality rendering. The scale factors
 * can be controlled on each X and Y axis independently. By default, all scale
 * factors are set to 1.0.
 *
 * enabled:   enable or disables dynamic resolution on a View
 *
 * homogeneousScaling: by default the system scales the major axis first. Set this to true
 *                     to force homogeneous scaling.
 *
 * minScale:  the minimum scale in X and Y this View should use
 *
 * maxScale:  the maximum scale in X and Y this View should use
 *
 * quality:   upscaling quality.
 *            LOW: 1 bilinear tap, Medium: 4 bilinear taps, High: 9 bilinear taps (tent)
 *
 * @note Dynamic resolution is only supported on platforms where the time to render
 * a frame can be measured accurately. Dynamic resolution is currently only
 * supported on Android.
 *
 * @see Renderer::FrameRateOptions
 *
 */
export interface DynamicResolutionOptions {
  /** enable or disable dynamic resolution  */
  enabled?: boolean

  /**
   * Set to true to force homogeneous scaling
   * @default false
   **/
  homogeneousScaling?: boolean

  /**
   * Minimum scale factors in x and y
   * @default [0.5, 0.5]
   */
  minScale?: [x: number, y: number]

  /**
   * Maximum scale factors in x and y
   * @default [1.0, 1.0]
   */
  maxScale?: [x: number, y: number]

  /**
   * Sharpness when QualityLevel::MEDIUM or higher is used [0 (disabled), 1 (sharpest)]
   *
   * @default 0.9
   */
  sharpness?: number

  /**
   * Upscaling quality
   * LOW:    bilinear filtered blit. Fastest, poor quality
   * MEDIUM: AMD FidelityFX FSR1 w/ mobile optimizations
   * HIGH:   AMD FidelityFX FSR1 w/ mobile optimizations
   * ULTRA:  AMD FidelityFX FSR1
   *      FSR1 require a well anti-aliased (MSAA or TAA), noise free scene.
   *
   * @default 'LOW'
   */
  quality?: QualityLevel
}
