#include "TextureMemory.hpp"

#include <algorithm>

namespace margelo::nitro::filament {

namespace {

  using Format = ::filament::Texture::InternalFormat;

  double bytesPerTexel(Format format) {
    switch (format) {
      case Format::R8:
      case Format::R8UI:
      case Format::R8I:
        return 1;
      case Format::RG8:
      case Format::R16F:
      case Format::DEPTH16:
        return 2;
      case Format::RGB8:
      case Format::SRGB8:
        return 3;
      case Format::RGBA16F:
      case Format::RGB16F:
      case Format::RG32F:
        return 8;
      case Format::RGBA32F:
      case Format::RGB32F:
        return 16;
      case Format::ETC2_RGB8:
      case Format::ETC2_SRGB8:
      case Format::DXT1_RGB:
      case Format::DXT1_SRGB:
        return 0.5;
      case Format::ETC2_EAC_RGBA8:
      case Format::ETC2_EAC_SRGBA8:
      case Format::DXT5_RGBA:
      case Format::DXT5_SRGBA:
      case Format::RGBA_ASTC_4x4:
      case Format::SRGB8_ALPHA8_ASTC_4x4:
        return 1;
      default:
        return 4;
    }
  }

} // namespace

size_t estimateTextureBytes(const ::filament::Texture& texture) {
  double perTexel = bytesPerTexel(texture.getFormat());
  size_t faces = texture.getTarget() == ::filament::Texture::Sampler::SAMPLER_CUBEMAP ? 6 : 1;
  double bytes = 0;
  for (size_t level = 0; level < texture.getLevels(); level++) {
    bytes += static_cast<double>(std::max<size_t>(1, texture.getWidth(level))) * std::max<size_t>(1, texture.getHeight(level)) *
             std::max<size_t>(1, texture.getDepth(level)) * perTexel;
  }
  return static_cast<size_t>(bytes) * faces;
}

} // namespace margelo::nitro::filament
