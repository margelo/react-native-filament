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
    if (inUnion == "LOW")
      *outEnum = QualityLevel::LOW;
    else if (inUnion == "MEDIUM")
      *outEnum = QualityLevel::MEDIUM;
    else if (inUnion == "HIGH")
      *outEnum = QualityLevel::HIGH;
    else if (inUnion == "ULTRA")
      *outEnum = QualityLevel::ULTRA;
    else
      throw invalidUnion(inUnion);
  }
  static void convertEnumToJSUnion(QualityLevel inEnum, std::string* outUnion) {
    switch (inEnum) {
      case QualityLevel::LOW:
        *outUnion = "LOW";
        break;
      case QualityLevel::MEDIUM:
        *outUnion = "MEDIUM";
        break;
      case QualityLevel::HIGH:
        *outUnion = "HIGH";
        break;
      case QualityLevel::ULTRA:
        *outUnion = "ULTRA";
        break;
      default:
        throw invalidEnum(inEnum);
    }
  }
} // namespace EnumMapper
} // namespace margelo
