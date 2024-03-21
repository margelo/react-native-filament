//
// Created by Marc Rousavy on 22.02.24.
//

#pragma once

#include "jsi/EnumMapper.h"
#include <backend/DriverEnums.h>

namespace margelo {
using namespace filament;

namespace EnumMapper {
  static void convertJSUnionToEnum(const std::string& inUnion, backend::CullingMode* outEnum) {
    if (inUnion == "none")
      *outEnum = backend::CullingMode::NONE;
    else if (inUnion == "back")
      *outEnum = backend::CullingMode::BACK;
    else if (inUnion == "front")
      *outEnum = backend::CullingMode::FRONT;
    else if (inUnion == "frontAndBack")
      *outEnum = backend::CullingMode::FRONT_AND_BACK;
    else
      throw invalidUnion(inUnion);
  }
  static void convertEnumToJSUnion(backend::CullingMode inEnum, std::string* outUnion) {
    switch (inEnum) {
      case backend::CullingMode::NONE:
        *outUnion = "none";
        break;
      case backend::CullingMode::BACK:
        *outUnion = "back";
        break;
      case backend::CullingMode::FRONT:
        *outUnion = "front";
        break;
      case backend::CullingMode::FRONT_AND_BACK:
        *outUnion = "frontAndBack";
        break;
      default:
        throw invalidEnum(inEnum);
    }
  }
} // namespace EnumMapper
} // namespace margelo