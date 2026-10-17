import { DynamicResolutionOptions } from '../types/Options'
import { View } from '../types/View'

// We need to wrap our options in a host object to be able to pass them to the view
export function makeDynamicResolutionHostObject(view: View, options: DynamicResolutionOptions): DynamicResolutionOptions {
  const optionsWrapper = view.createDynamicResolutionOptions()
  if (options.enabled != null) {
    optionsWrapper.enabled = options.enabled
  }
  if (options.homogeneousScaling != null) {
    optionsWrapper.homogeneousScaling = options.homogeneousScaling
  }
  if (options.maxScale != null) {
    optionsWrapper.maxScale = options.maxScale
  }
  if (options.minScale != null) {
    optionsWrapper.minScale = options.minScale
  }
  if (options.quality != null) {
    optionsWrapper.quality = options.quality
  }
  if (options.sharpness != null) {
    optionsWrapper.sharpness = options.sharpness
  }
  return optionsWrapper
}
