#pragma once

#include "MaterialCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

std::shared_ptr<MaterialCore> createDebugLineMaterial(std::shared_ptr<EngineCore> engine);

} // namespace margelo::nitro::filament
