#pragma once

#include "Aabb.hpp"
#include "AnimationInfo.hpp"

#include <gltfio/FilamentAsset.h>
#include <gltfio/FilamentInstance.h>

#include <optional>
#include <string>
#include <unordered_map>
#include <vector>

namespace margelo::nitro::filament {

struct ModelInstanceSnapshot {
  static ModelInstanceSnapshot capture(::filament::gltfio::FilamentInstance& instance);

  double rootEntity;
  std::vector<double> entities;
  std::vector<AnimationInfo> animations;
  std::vector<std::string> materialVariants;
  size_t skinCount;
};

struct ModelSnapshot {
  static ModelSnapshot capture(::filament::gltfio::FilamentAsset& asset);

  std::optional<double> entityByName(const std::string& name) const;

  double rootEntity;
  Aabb boundingBox;
  std::unordered_map<std::string, double> entitiesByName;
};

} // namespace margelo::nitro::filament
