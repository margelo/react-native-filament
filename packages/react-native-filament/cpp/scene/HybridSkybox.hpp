#pragma once

#include "HybridSkyboxSpec.hpp"
#include "SkyboxCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridEngine;

class HybridSkybox final : public HybridSkyboxSpec {
public:
  HybridSkybox(std::shared_ptr<HybridEngine> engine, std::shared_ptr<SkyboxCore> core);

  void dispose() override;

  const std::shared_ptr<EngineCore>& engineCore() const;
  const std::shared_ptr<SkyboxCore>& core() const;

private:
  std::shared_ptr<HybridEngine> engine_;
  std::shared_ptr<SkyboxCore> core_;
};

} // namespace margelo::nitro::filament
