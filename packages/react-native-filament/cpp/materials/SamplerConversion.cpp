#include "SamplerConversion.hpp"

namespace margelo::nitro::filament {

namespace {

  using Sampler = ::filament::TextureSampler;

  Sampler::MinFilter toMinFilter(SamplerMinFilter filter) {
    switch (filter) {
      case SamplerMinFilter::NEAREST:
        return Sampler::MinFilter::NEAREST;
      case SamplerMinFilter::LINEAR:
        return Sampler::MinFilter::LINEAR;
      case SamplerMinFilter::NEAREST_MIPMAP_NEAREST:
        return Sampler::MinFilter::NEAREST_MIPMAP_NEAREST;
      case SamplerMinFilter::LINEAR_MIPMAP_NEAREST:
        return Sampler::MinFilter::LINEAR_MIPMAP_NEAREST;
      case SamplerMinFilter::NEAREST_MIPMAP_LINEAR:
        return Sampler::MinFilter::NEAREST_MIPMAP_LINEAR;
      case SamplerMinFilter::LINEAR_MIPMAP_LINEAR:
        return Sampler::MinFilter::LINEAR_MIPMAP_LINEAR;
    }
  }

  Sampler::WrapMode toWrapMode(SamplerWrapMode mode) {
    switch (mode) {
      case SamplerWrapMode::CLAMP_TO_EDGE:
        return Sampler::WrapMode::CLAMP_TO_EDGE;
      case SamplerWrapMode::REPEAT:
        return Sampler::WrapMode::REPEAT;
      case SamplerWrapMode::MIRRORED_REPEAT:
        return Sampler::WrapMode::MIRRORED_REPEAT;
    }
  }

} // namespace

::filament::TextureSampler toTextureSampler(const SamplerOptions& options) {
  Sampler::MagFilter mag = options.magFilter.value_or(SamplerMagFilter::LINEAR) == SamplerMagFilter::NEAREST ? Sampler::MagFilter::NEAREST
                                                                                                             : Sampler::MagFilter::LINEAR;
  return Sampler(toMinFilter(options.minFilter.value_or(SamplerMinFilter::LINEAR_MIPMAP_LINEAR)), mag,
                 toWrapMode(options.wrapS.value_or(SamplerWrapMode::REPEAT)), toWrapMode(options.wrapT.value_or(SamplerWrapMode::REPEAT)),
                 Sampler::WrapMode::REPEAT);
}

} // namespace margelo::nitro::filament
