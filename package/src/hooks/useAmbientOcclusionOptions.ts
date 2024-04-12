import { useEffect } from 'react'
import { View } from '../types'
import { AmbientOcclusionOptions } from '../types/OptionsHelper'

export function useAmbientOcclusionOptions(view: View, options: AmbientOcclusionOptions) {
  useEffect(() => {
    const optionsWrapper = view.createAmbientOcclusionOptions()
    if (options.radius != null) {
      optionsWrapper.radius = options.radius
    }
    if (options.bias != null) {
      optionsWrapper.bias = options.bias
    }
    if (options.resolution != null) {
      optionsWrapper.resolution = options.resolution
    }
    if (options.intensity != null) {
      optionsWrapper.intensity = options.intensity
    }
    if (options.bilateralThreshold != null) {
      optionsWrapper.bilateralThreshold = options.bilateralThreshold
    }
    if (options.quality != null) {
      optionsWrapper.quality = options.quality
    }
    if (options.lowPassFilter != null) {
      optionsWrapper.lowPassFilter = options.lowPassFilter
    }
    if (options.upsampling != null) {
      optionsWrapper.upsampling = options.upsampling
    }
    if (options.enabled != null) {
      optionsWrapper.enabled = options.enabled
    }
    if (options.bentNormals != null) {
      optionsWrapper.bentNormals = options.bentNormals
    }
    if (options.minHorizonAngleRad != null) {
      optionsWrapper.minHorizonAngleRad = options.minHorizonAngleRad
    }

    view.setAmbientOcclusionOptions(optionsWrapper)
  }, [
    options.bentNormals,
    options.bias,
    options.bilateralThreshold,
    options.enabled,
    options.intensity,
    options.lowPassFilter,
    options.minHorizonAngleRad,
    options.power,
    options.quality,
    options.radius,
    options.resolution,
    options.upsampling,
    view,
  ])
}
