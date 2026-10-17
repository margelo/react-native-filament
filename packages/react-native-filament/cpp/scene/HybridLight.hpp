#pragma once

#include "HybridLightSpec.hpp"
#include "LightCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridEngine;

class HybridLight final : public HybridLightSpec {
public:
  HybridLight(std::shared_ptr<HybridEngine> engine, std::shared_ptr<LightCore> core);

  double getEntity() override;
  void dispose() override;

private:
  std::shared_ptr<HybridEngine> engine_;
  std::shared_ptr<LightCore> core_;
};

} // namespace margelo::nitro::filament
