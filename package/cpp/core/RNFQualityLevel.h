//
// Created by Hanno Gödecke on 29.02.24.
//

#pragma once

#include "jsi/RNFEnumMapper.h"
#include <filament/Options.h>

namespace margelo {

namespace EnumMapper {
  using namespace filament;

  static void convertJSUnionToEnum(const std::string& inUnion, QualityLevel* outEnum) {
    if (inUnion == "low")
      *outEnum = QualityLevel::LOW;
    else if (inUnion == "medium")
      *outEnum = QualityLevel::MEDIUM;
    else if (inUnion == "high")
      *outEnum = QualityLevel::HIGH;
    else if (inUnion == "ultra")
      *outEnum = QualityLevel::ULTRA;
    else
      throw invalidUnion(inUnion);
  }
  static void convertEnumToJSUnion(QualityLevel inEnum, std::string* outUnion) {
    switch (inEnum) {
      case QualityLevel::LOW:
        *outUnion = "low";
        break;
      case QualityLevel::MEDIUM:
        *outUnion = "medium";
        break;
      case QualityLevel::HIGH:
        *outUnion = "high";
        break;
      case QualityLevel::ULTRA:
        *outUnion = "ultra";
        break;
      default:
        throw invalidEnum(inEnum);
    }
  }
} // namespace EnumMapper
} // namespace margelo
