//
// Created by Hanno Gödecke on 22.03.24.
//

#pragma once

#include <gltfio/TextureProvider.h>

namespace margelo {
using namespace filament;
using namespace gltfio;

namespace EnumMapper {
  static void convertJSUnionToEnum(const std::string& inUnion, TextureProvider::TextureFlags* outEnum) {
    if (inUnion == "none")
      *outEnum = TextureProvider::TextureFlags::NONE;
    else if (inUnion == "sRGB")
      *outEnum = TextureProvider::TextureFlags::sRGB;
    else
      throw invalidUnion(inUnion);
  }
  static void convertEnumToJSUnion(TextureProvider::TextureFlags inEnum, std::string* outUnion) {
    switch (inEnum) {
      case TextureProvider::TextureFlags::NONE:
        *outUnion = "none";
        break;
      case TextureProvider::TextureFlags::sRGB:
        *outUnion = "sRGB";
        break;
      default:
        throw invalidEnum(inEnum);
    }
  }
} // namespace EnumMapper
} // namespace margelo
