#pragma once

#include "DebugBoxOptions.hpp"
#include "GeometryCore.hpp"
#include "PlaneOptions.hpp"
#include "materials/MaterialCore.hpp"

#include <filament/MaterialInstance.h>

#include <memory>

namespace margelo::nitro::filament {

struct AssignedMaterial {
  ::filament::MaterialInstance& instance;
  std::shared_ptr<void> owner;
};

std::shared_ptr<GeometryCore> buildPlane(std::shared_ptr<EngineCore> engine, const PlaneOptions& options, AssignedMaterial material);
std::shared_ptr<GeometryCore> buildBackground(std::shared_ptr<EngineCore> engine, AssignedMaterial material);
std::shared_ptr<GeometryCore> buildDebugBox(std::shared_ptr<EngineCore> engine, const DebugBoxOptions& options,
                                            std::shared_ptr<MaterialCore> lineMaterial);

} // namespace margelo::nitro::filament
