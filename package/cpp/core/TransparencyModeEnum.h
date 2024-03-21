//
// Created by Marc Rousavy on 22.02.24.
//

#pragma once

#include "jsi/EnumMapper.h"
#include <filament/Material.h>

namespace margelo {
using namespace filament;

namespace EnumMapper {
  static void convertJSUnionToEnum(const std::string& inUnion, TransparencyMode* outEnum) {
    if (inUnion == "default")
      *outEnum = TransparencyMode::DEFAULT;
    else if (inUnion == "twoPassesOneSide")
      *outEnum = TransparencyMode::TWO_PASSES_ONE_SIDE;
    else if (inUnion == "twoPassesTwoSides")
      *outEnum = TransparencyMode::TWO_PASSES_TWO_SIDES;
    else
      throw invalidUnion(inUnion);
  }
  static void convertEnumToJSUnion(TransparencyMode inEnum, std::string* outUnion) {
    switch (inEnum) {
      case filament::TransparencyMode::DEFAULT:
        *outUnion = "default";
        break;
      case filament::TransparencyMode::TWO_PASSES_ONE_SIDE:
        *outUnion = "twoPassesOneSide";
        break;
      case filament::TransparencyMode::TWO_PASSES_TWO_SIDES:
        *outUnion = "twoPassesTwoSides";
        break;
      default:
        throw invalidEnum(inEnum);
    }
  }
} // namespace EnumMapper
} // namespace margelo