import { BloomOptions } from '../types/Options'
import { View } from '../types/View'

// We need to wrap our options in a host object to be able to pass them to the view
export function makeBloomHostObject(view: View, options: BloomOptions): BloomOptions {
  const optionsWrapper = view.createBloomOptions()
  if (options.enabled != null) {
    optionsWrapper.enabled = options.enabled
  }
  if (options.levels != null) {
    optionsWrapper.levels = options.levels
  }
  if (options.resolution != null) {
    optionsWrapper.resolution = options.resolution
  }
  if (options.strength != null) {
    optionsWrapper.strength = options.strength
  }
  if (options.blendMode != null) {
    optionsWrapper.blendMode = options.blendMode
  }
  if (options.threshold != null) {
    optionsWrapper.threshold = options.threshold
  }
  if (options.highlight != null) {
    optionsWrapper.highlight = options.highlight
  }
  if (options.quality != null) {
    optionsWrapper.quality = options.quality
  }
  if (options.lensFlare != null) {
    optionsWrapper.lensFlare = options.lensFlare
  }
  if (options.starburst != null) {
    optionsWrapper.starburst = options.starburst
  }
  if (options.chromaticAberration != null) {
    optionsWrapper.chromaticAberration = options.chromaticAberration
  }
  if (options.ghostCount != null) {
    optionsWrapper.ghostCount = options.ghostCount
  }
  if (options.ghostSpacing != null) {
    optionsWrapper.ghostSpacing = options.ghostSpacing
  }
  if (options.ghostThreshold != null) {
    optionsWrapper.ghostThreshold = options.ghostThreshold
  }
  if (options.haloThickness != null) {
    optionsWrapper.haloThickness = options.haloThickness
  }
  if (options.haloRadius != null) {
    optionsWrapper.haloRadius = options.haloRadius
  }
  if (options.haloThreshold != null) {
    optionsWrapper.haloThreshold = options.haloThreshold
  }
  return optionsWrapper
}
