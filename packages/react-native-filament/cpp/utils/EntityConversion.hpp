#pragma once

#include <utils/Entity.h>

namespace margelo::nitro::filament {

inline utils::Entity toEntity(double id) {
  return utils::Entity::import(static_cast<int>(id));
}

inline double fromEntity(utils::Entity entity) {
  return static_cast<double>(entity.getId());
}

} // namespace margelo::nitro::filament
