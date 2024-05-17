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

/**
 * Options for Temporal Anti-aliasing (TAA)
 * Most TAA parameters are extremely costly to change, as they will trigger the TAA post-process
 * shaders to be recompiled. These options should be changed or set during initialization.
 * `filterWidth`, `feedback` and `jitterPattern`, however, can be changed at any time.
 *
 * `feedback` of 0.1 effectively accumulates a maximum of 19 samples in steady state.
 * see "A Survey of Temporal Antialiasing Techniques" by Lei Yang and all for more information.
 */
export interface TemporalAntiAliasingOptions {
  /**
   * Reconstruction filter width typically between 0.2 (sharper, aliased) and 1.5 (smoother)
   * @default 1.0
   */
  filterWidth?: number
  /**
   * History feedback, between 0 (maximum temporal AA) and 1 (no temporal AA).
   * @default 0.12
   */
  feedback?: number
  /**
   * Texturing lod bias (typically -1 or -2)
   * @default -1.0
   */
  lodBias?: number
  /**
   * Post-TAA sharpen, especially useful when upscaling is true.
   * @default 0.0
   */
  sharpness?: number
  /**
   * Enable or disable TAA
   * @default false
   */
  enabled: boolean
  /**
   * Enable or disable upscaling
   * @default false
   */
  upscaling?: boolean

  /**
   * Clipping algorithm:
   * - NONE: no rejections (use for debugging)
   * - CLAMP: clamping
   * - ACCURATE: accurate box clipping
   *
   * @default 'ACCURATE'
   */
  boxClipping?: 'ACCURATE' | 'CLAMP' | 'NONE'

  /**
   * Jitter Pattern:
   * - RGSS_X4: 4-samples, rotated grid sampling
   * - UNIFORM_HELIX_X4: 4-samples, uniform grid in helix sequence
   * - HALTON_23_X8: 8-samples of halton 2,3
   * - HALTON_23_X16: 16-samples of halton 2,3
   * - HALTON_23_X32: 32-samples of halton 2,3
   *
   * @default 'HALTON_23_X16'
   */
  jitterPattern?: 'RGSS_X4' | 'UNIFORM_HELIX_X4' | 'HALTON_23_X8' | 'HALTON_23_X16' | 'HALTON_23_X32'

  /**
   * Whether to filter the history buffer
   * @default true
   */
  filterHistory?: boolean
  /**
   * Whether to apply the reconstruction filter to the input
   * @default true
   */
  filterInput?: boolean
  /**
   * Whether to use the YcoCg color-space for history rejection
   * @default false
   */
  useYCoCg?: boolean
  /**
   * High values increases ghosting artefact, lower values increases jittering, range [0.75, 1.25]
   * @default 1.0
   */
  varianceGamma?: number
  /**
   * Adjust the feedback dynamically to reduce flickering
   * @default false
   */
  preventFlickering?: boolean
  /**
   * Whether to apply history reprojection (debug option)
   * @default true
   */
  historyReprojection?: boolean
}

type Entries<T, K extends keyof T = keyof T> = (K extends unknown ? [K, T[K]] : never)[]
const getEntries = <T extends object>(obj: T) => Object.entries(obj) as unknown as Entries<T>

function boxClippingToNumber(boxClipping: TemporalAntiAliasingOptions['boxClipping']): number {
  switch (boxClipping) {
    case 'ACCURATE':
      return 0
    case 'CLAMP':
      return 1
    case 'NONE':
      return 2
  }
  throw new Error(`Unknown boxClipping: ${boxClipping}`)
}
function jitterPatternToNumber(jitterPattern: TemporalAntiAliasingOptions['jitterPattern']): number {
  switch (jitterPattern) {
    case 'RGSS_X4':
      return 0
    case 'UNIFORM_HELIX_X4':
      return 1
    case 'HALTON_23_X8':
      return 2
    case 'HALTON_23_X16':
      return 3
    case 'HALTON_23_X32':
      return 4
  }
  throw new Error(`Unknown jitterPattern: ${jitterPattern}`)
}

// Currently on JSi we don't support passing arbitrary objects.
// The method for receiving the options is expected to receive a Record<string, number>, where booleans are
// represented as 0.0 or 1.0.
export function optionsToJSI(options: TemporalAntiAliasingOptions): Record<string, number> {
  const result: Record<string, number> = {}
  const entries = getEntries(options)
  entries.forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      result[key] = value ? 1.0 : 0.0
    } else {
      if (key === 'boxClipping') {
        result[key] = boxClippingToNumber(value)
      } else if (key === 'jitterPattern') {
        result[key] = jitterPatternToNumber(value)
      } else if (value != null) {
        result[key] = value
      }
    }
  })
  return result
}
