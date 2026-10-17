//
// Created by Marc Rousavy on 22.02.24.
//

#pragma once

#include "jsi/RNFEnumMapper.h"
#include <filament/Camera.h>

namespace margelo {
using namespace filament;

namespace EnumMapper {
  static void convertJSUnionToEnum(const std::string& inUnion, Camera::Fov* outEnum) {
    if (inUnion == "horizontal")
      *outEnum = Camera::Fov::HORIZONTAL;
    else if (inUnion == "vertical")
      *outEnum = Camera::Fov::VERTICAL;
    else
      throw invalidUnion(inUnion);
  }
  static void convertEnumToJSUnion(Camera::Fov inEnum, std::string* outUnion) {
    switch (inEnum) {
      case filament::Camera::Fov::HORIZONTAL:
        *outUnion = "horizontal";
        break;
      case filament::Camera::Fov::VERTICAL:
        *outUnion = "vertical";
        break;
      default:
        throw invalidEnum(inEnum);
    }
  }
} // namespace EnumMapper
} // namespace margelo