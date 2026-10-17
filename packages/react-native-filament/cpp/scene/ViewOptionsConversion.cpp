#include "ViewOptionsConversion.hpp"

namespace margelo::nitro::filament {

namespace {

  ::filament::QualityLevel toFilamentQuality(QualityLevel quality) {
    switch (quality) {
      case QualityLevel::LOW:
        return ::filament::QualityLevel::LOW;
      case QualityLevel::MEDIUM:
        return ::filament::QualityLevel::MEDIUM;
      case QualityLevel::HIGH:
        return ::filament::QualityLevel::HIGH;
      case QualityLevel::ULTRA:
        return ::filament::QualityLevel::ULTRA;
    }
  }

  template <typename Target, typename Source> void assign(Target& target, const std::optional<Source>& source) {
    if (source.has_value()) {
      target = static_cast<Target>(*source);
    }
  }

  void assign(::filament::QualityLevel& target, const std::optional<QualityLevel>& source) {
    if (source.has_value()) {
      target = toFilamentQuality(*source);
    }
  }

} // namespace

::filament::AmbientOcclusionOptions toFilamentOptions(const AmbientOcclusionOptions& options) {
  ::filament::AmbientOcclusionOptions result;
  assign(result.enabled, options.enabled);
  if (options.type.has_value()) {
    result.aoType = *options.type == AmbientOcclusionType::GTAO ? ::filament::AmbientOcclusionOptions::AmbientOcclusionType::GTAO
                                                                : ::filament::AmbientOcclusionOptions::AmbientOcclusionType::SAO;
  }
  assign(result.radius, options.radius);
  assign(result.power, options.power);
  assign(result.bias, options.bias);
  assign(result.resolution, options.resolution);
  assign(result.intensity, options.intensity);
  assign(result.bilateralThreshold, options.bilateralThreshold);
  assign(result.quality, options.quality);
  assign(result.lowPassFilter, options.lowPassFilter);
  assign(result.upsampling, options.upsampling);
  assign(result.bentNormals, options.bentNormals);
  assign(result.minHorizonAngleRad, options.minHorizonAngleRadians);
  return result;
}

::filament::BloomOptions toFilamentOptions(const BloomOptions& options) {
  ::filament::BloomOptions result;
  assign(result.enabled, options.enabled);
  assign(result.strength, options.strength);
  assign(result.resolution, options.resolution);
  assign(result.levels, options.levels);
  if (options.blendMode.has_value()) {
    result.blendMode = *options.blendMode == BloomBlendMode::INTERPOLATE ? ::filament::BloomOptions::BlendMode::INTERPOLATE
                                                                         : ::filament::BloomOptions::BlendMode::ADD;
  }
  assign(result.threshold, options.threshold);
  assign(result.highlight, options.highlight);
  assign(result.quality, options.quality);
  assign(result.lensFlare, options.lensFlare);
  assign(result.starburst, options.starburst);
  assign(result.chromaticAberration, options.chromaticAberration);
  assign(result.ghostCount, options.ghostCount);
  assign(result.ghostSpacing, options.ghostSpacing);
  assign(result.ghostThreshold, options.ghostThreshold);
  assign(result.haloThickness, options.haloThickness);
  assign(result.haloRadius, options.haloRadius);
  assign(result.haloThreshold, options.haloThreshold);
  return result;
}

::filament::TemporalAntiAliasingOptions toFilamentOptions(const TemporalAntiAliasingOptions& options) {
  using Filament = ::filament::TemporalAntiAliasingOptions;
  Filament result;
  assign(result.enabled, options.enabled);
  assign(result.filterWidth, options.filterWidth);
  assign(result.feedback, options.feedback);
  assign(result.lodBias, options.lodBias);
  assign(result.sharpness, options.sharpness);
  assign(result.upscaling, options.upscaling);
  assign(result.filterHistory, options.filterHistory);
  assign(result.filterInput, options.filterInput);
  assign(result.useYCoCg, options.useYCoCg);
  assign(result.hdr, options.hdr);
  if (options.boxType.has_value()) {
    result.boxType =
        *options.boxType == TemporalAntiAliasingBoxType::AABB_VARIANCE ? Filament::BoxType::AABB_VARIANCE : Filament::BoxType::AABB;
  }
  if (options.boxClipping.has_value()) {
    switch (*options.boxClipping) {
      case TemporalAntiAliasingBoxClipping::ACCURATE:
        result.boxClipping = Filament::BoxClipping::ACCURATE;
        break;
      case TemporalAntiAliasingBoxClipping::CLAMP:
        result.boxClipping = Filament::BoxClipping::CLAMP;
        break;
      case TemporalAntiAliasingBoxClipping::NONE:
        result.boxClipping = Filament::BoxClipping::NONE;
        break;
    }
  }
  if (options.jitterPattern.has_value()) {
    switch (*options.jitterPattern) {
      case TemporalAntiAliasingJitterPattern::RGSS_X4:
        result.jitterPattern = Filament::JitterPattern::RGSS_X4;
        break;
      case TemporalAntiAliasingJitterPattern::UNIFORM_HELIX_X4:
        result.jitterPattern = Filament::JitterPattern::UNIFORM_HELIX_X4;
        break;
      case TemporalAntiAliasingJitterPattern::HALTON_23_X8:
        result.jitterPattern = Filament::JitterPattern::HALTON_23_X8;
        break;
      case TemporalAntiAliasingJitterPattern::HALTON_23_X16:
        result.jitterPattern = Filament::JitterPattern::HALTON_23_X16;
        break;
      case TemporalAntiAliasingJitterPattern::HALTON_23_X32:
        result.jitterPattern = Filament::JitterPattern::HALTON_23_X32;
        break;
    }
  }
  assign(result.varianceGamma, options.varianceGamma);
  assign(result.preventFlickering, options.preventFlickering);
  assign(result.historyReprojection, options.historyReprojection);
  return result;
}

::filament::DynamicResolutionOptions toFilamentOptions(const DynamicResolutionOptions& options) {
  ::filament::DynamicResolutionOptions result;
  assign(result.enabled, options.enabled);
  assign(result.homogeneousScaling, options.homogeneousScaling);
  if (options.minScale.has_value()) {
    auto [x, y] = *options.minScale;
    result.minScale = {static_cast<float>(x), static_cast<float>(y)};
  }
  if (options.maxScale.has_value()) {
    auto [x, y] = *options.maxScale;
    result.maxScale = {static_cast<float>(x), static_cast<float>(y)};
  }
  assign(result.sharpness, options.sharpness);
  assign(result.quality, options.quality);
  return result;
}

} // namespace margelo::nitro::filament
