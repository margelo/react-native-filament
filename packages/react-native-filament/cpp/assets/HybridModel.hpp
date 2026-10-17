#pragma once

#include "HybridModelSpec.hpp"
#include "ModelCore.hpp"

#include <memory>
#include <vector>

namespace margelo::nitro::filament {

class HybridEngine;

class HybridModel final : public HybridModelSpec {
public:
  HybridModel(std::shared_ptr<HybridEngine> engine, std::shared_ptr<ModelCore> core);

  double getRootEntity() override;
  std::vector<double> getEntities() override;
  Aabb getBoundingBox() override;
  double getInstanceCount() override;
  std::shared_ptr<HybridModelInstanceSpec> getInstance(double index) override;
  std::optional<double> getEntityByName(const std::string& name) override;
  void dispose() override;

  const std::shared_ptr<EngineCore>& engineCore() const;
  const std::shared_ptr<ModelCore>& core() const;

private:
  std::shared_ptr<HybridEngine> engine_;
  std::shared_ptr<ModelCore> core_;
  std::vector<std::shared_ptr<HybridModelInstanceSpec>> instances_;
};

} // namespace margelo::nitro::filament
