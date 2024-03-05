//
// Created by Hanno Gödecke on 29.02.24.
//

#pragma once

#include "jsi/EnumMapper.h"
#include <filament/LightManager.h>

namespace margelo {

namespace EnumMapper {
  using namespace filament;

  static void convertJSUnionToEnum(const std::string& inUnion, LightManager::Type* outEnum) {
    if (inUnion == "directional")
      *outEnum = LightManager::Type::DIRECTIONAL;
    else if (inUnion == "spot")
      *outEnum = LightManager::Type::SPOT;
    else if (inUnion == "point")
      *outEnum = LightManager::Type::POINT;
    else if (inUnion == "focused_sport")
      *outEnum = LightManager::Type::FOCUSED_SPOT;
    else if (inUnion == "sun")
      *outEnum = LightManager::Type::SUN;
    else
      throw invalidUnion(inUnion);
  }
  static void convertEnumToJSUnion(LightManager::Type inEnum, std::string* outUnion) {
    switch (inEnum) {
      case LightManager::Type::DIRECTIONAL:
        *outUnion = "directional";
        break;
      case LightManager::Type::SPOT:
        *outUnion = "spot";
        break;
      case LightManager::Type::POINT:
        *outUnion = "point";
        break;
      case LightManager::Type::FOCUSED_SPOT:
        *outUnion = "focused_sport";
        break;
      case LightManager::Type::SUN:
        *outUnion = "sun";
        break;
      default:
        throw invalidEnum(inEnum);
    }
  }
} // namespace EnumMapper
} // namespace margelo
