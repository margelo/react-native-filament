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
