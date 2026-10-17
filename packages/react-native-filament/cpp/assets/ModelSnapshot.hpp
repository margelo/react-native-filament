#pragma once

#include "Aabb.hpp"
#include "AnimationInfo.hpp"

#include <gltfio/FilamentAsset.h>

#include <optional>
#include <string>
#include <unordered_map>
#include <vector>

namespace margelo::nitro::filament {

struct ModelInstanceSnapshot {
  double rootEntity;
  std::vector<double> entities;
  std::vector<AnimationInfo> animations;
};

struct ModelSnapshot {
  static ModelSnapshot capture(::filament::gltfio::FilamentAsset& asset);

  std::optional<double> entityByName(const std::string& name) const;

  double rootEntity;
  std::vector<double> entities;
  Aabb boundingBox;
  std::vector<ModelInstanceSnapshot> instances;
  std::unordered_map<std::string, double> entitiesByName;
};

} // namespace margelo::nitro::filament
