#pragma once

#include "EntityConversion.hpp"

#include <filament/TransformManager.h>

#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

inline ::filament::TransformManager::Instance requireTransform(const ::filament::TransformManager& transforms, double entity,
                                                               const char* method) {
  ::filament::TransformManager::Instance instance = transforms.getInstance(toEntity(entity));
  if (!instance.isValid()) {
    throw std::invalid_argument(std::string("FilamentInvalidEntityError: ") + method +
                                " needs an entity with a transform component in this Engine, got " +
                                std::to_string(static_cast<int64_t>(entity)) + ".");
  }
  return instance;
}

} // namespace margelo::nitro::filament
