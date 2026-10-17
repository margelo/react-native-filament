#pragma once

#include "HybridModelInstanceSpec.hpp"
#include "ModelCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridEngine;

class HybridModelInstance final : public HybridModelInstanceSpec {
public:
  HybridModelInstance(std::shared_ptr<HybridEngine> engine, std::shared_ptr<ModelCore> core, size_t index,
                      std::shared_ptr<const ModelInstanceSnapshot> snapshot);

  double getRootEntity() override;
  std::vector<double> getEntities() override;
  std::shared_ptr<HybridAnimatorSpec> getAnimator() override;
  std::vector<std::string> getMaterialVariants() override;
  double getSkinCount() override;
  void applyMaterialVariant(double index) override;
  void attachSkin(double skinIndex, double target) override;
  void detachSkin(double skinIndex, double target) override;
  void followSkeleton(const std::optional<std::shared_ptr<HybridModelInstanceSpec>>& source) override;
  void recomputeBoundingBoxes() override;

  const std::shared_ptr<EngineCore>& engineCore() const;
  const std::shared_ptr<ModelCore>& core() const;
  size_t index() const;

private:
  ::filament::gltfio::FilamentInstance& usable(const char* method);

  std::shared_ptr<ModelCore> core_;
  size_t index_;
  std::shared_ptr<const ModelInstanceSnapshot> snapshot_;
  std::shared_ptr<HybridAnimatorSpec> animator_;
};

} // namespace margelo::nitro::filament
