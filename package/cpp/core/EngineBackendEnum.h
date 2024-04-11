//
// Created by Hanno Gödecke on 11.04.24.
//

#pragma once

#include "jsi/EnumMapper.h"
#include <filament/Engine.h>

namespace margelo {

namespace EnumMapper {
  using namespace filament;

  static void convertJSUnionToEnum(const std::string& inUnion, Engine::Backend* outEnum) {
    if (inUnion == "default")
      *outEnum = Engine::Backend::DEFAULT;
    else if (inUnion == "metal")
      *outEnum = Engine::Backend::METAL;
    else if (inUnion == "opengl")
      *outEnum = Engine::Backend::OPENGL;
    else if (inUnion == "vulkan")
      *outEnum = Engine::Backend::VULKAN;
    else
      throw invalidUnion(inUnion);
  }
  static void convertEnumToJSUnion(Engine::Backend inEnum, std::string* outUnion) {
    switch (inEnum) {
      case Engine::Backend::DEFAULT:
        *outUnion = "default";
        break;
      case Engine::Backend::METAL:
        *outUnion = "metal";
        break;
      case Engine::Backend::OPENGL:
        *outUnion = "opengl";
        break;
      case Engine::Backend::VULKAN:
        *outUnion = "vulkan";
        break;
      default:
        throw invalidEnum(inEnum);
    }
  }
} // namespace EnumMapper
} // namespace margelo
