import { AmbientOcclusionOptions } from '../types/Options'
import { View } from '../types/View'

// We need to wrap our options in a host object to be able to pass them to the view
export function makeAmbientOcclusionHostObject(view: View, options: AmbientOcclusionOptions): AmbientOcclusionOptions {
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

  return optionsWrapper
}
