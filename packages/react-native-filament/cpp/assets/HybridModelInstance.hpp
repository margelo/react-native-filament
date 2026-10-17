#pragma once

#include "HybridModelInstanceSpec.hpp"
#include "ModelCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridEngine;

class HybridModelInstance final : public HybridModelInstanceSpec {
public:
  HybridModelInstance(std::shared_ptr<HybridEngine> engine, std::shared_ptr<ModelCore> core, size_t index);

  double getRootEntity() override;
  std::vector<double> getEntities() override;
  std::shared_ptr<HybridAnimatorSpec> getAnimator() override;

private:
  const ModelInstanceSnapshot& snapshot() const;

  std::shared_ptr<ModelCore> core_;
  size_t index_;
  std::shared_ptr<HybridAnimatorSpec> animator_;
};

} // namespace margelo::nitro::filament
