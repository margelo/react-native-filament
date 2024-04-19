//
// Created by Hanno Gödecke on 29.02.24.
//

#pragma once

#include "jsi/EnumMapper.h"
#include <filament/Options.h>

namespace margelo {

namespace EnumMapper {
  using namespace filament;

  static void convertJSUnionToEnum(const std::string& inUnion, Dithering* outEnum) {
    if (inUnion == "none")
      *outEnum = Dithering::NONE;
    else if (inUnion == "temporal")
      *outEnum = Dithering::TEMPORAL;
    else
      throw invalidUnion(inUnion);
  }
  static void convertEnumToJSUnion(Dithering inEnum, std::string* outUnion) {
    switch (inEnum) {
      case Dithering::NONE:
        *outUnion = "none";
        break;
      case Dithering::TEMPORAL:
        *outUnion = "temporal";
        break;
      default:
        throw invalidEnum(inEnum);
    }
  }
} // namespace EnumMapper
} // namespace margelo
