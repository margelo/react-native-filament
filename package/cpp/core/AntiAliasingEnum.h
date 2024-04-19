//
// Created by Hanno Gödecke on 29.02.24.
//

#pragma once

#include "jsi/EnumMapper.h"
#include <filament/Options.h>

namespace margelo {

namespace EnumMapper {
  using namespace filament;

  static void convertJSUnionToEnum(const std::string& inUnion, AntiAliasing* outEnum) {
    if (inUnion == "none")
      *outEnum = AntiAliasing::NONE;
    else if (inUnion == "FXAA")
      *outEnum = AntiAliasing::FXAA;
    else
      throw invalidUnion(inUnion);
  }
  static void convertEnumToJSUnion(AntiAliasing inEnum, std::string* outUnion) {
    switch (inEnum) {
      case AntiAliasing::NONE:
        *outUnion = "none";
        break;
      case AntiAliasing::FXAA:
        *outUnion = "FXAA";
        break;
      default:
        throw invalidEnum(inEnum);
    }
  }
} // namespace EnumMapper
} // namespace margelo
