#pragma once

#include "EntityConversion.hpp"

#include <cstdint>
#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

template <typename Manager>
typename Manager::Instance requireComponent(const Manager& manager, double entity, const char* method, const char* component) {
  typename Manager::Instance instance = manager.getInstance(toEntity(entity));
  if (!instance.isValid()) {
    throw std::invalid_argument(std::string("FilamentInvalidEntityError: ") + method + " needs an entity with a " + component +
                                " component in this Engine, got " + std::to_string(static_cast<int64_t>(entity)) + ".");
  }
  return instance;
}

} // namespace margelo::nitro::filament
