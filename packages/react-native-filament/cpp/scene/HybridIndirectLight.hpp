#pragma once

#include "HybridIndirectLightSpec.hpp"
#include "IndirectLightCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridEngine;

class HybridIndirectLight final : public HybridIndirectLightSpec {
public:
  HybridIndirectLight(std::shared_ptr<HybridEngine> engine, std::shared_ptr<IndirectLightCore> core);

  void dispose() override;
  size_t getExternalMemorySize() noexcept override;

  const std::shared_ptr<EngineCore>& engineCore() const;
  const std::shared_ptr<IndirectLightCore>& core() const;

private:
  std::shared_ptr<HybridEngine> engine_;
  std::shared_ptr<IndirectLightCore> core_;
};

} // namespace margelo::nitro::filament
