#pragma once

#include "HybridRenderableManagerSpec.hpp"
#include "engine/EngineCore.hpp"

#include <filament/RenderableManager.h>

#include <memory>

namespace margelo::nitro::filament {

class HybridRenderableManager final : public HybridRenderableManagerSpec {
public:
  explicit HybridRenderableManager(std::shared_ptr<EngineCore> engine);

  double getPrimitiveCount(double entity) override;
  bool isShadowCaster(double entity) override;
  void setCastShadows(double entity, bool castShadows) override;
  bool isShadowReceiver(double entity) override;
  void setReceiveShadows(double entity, bool receiveShadows) override;
  Aabb getAxisAlignedBoundingBox(double entity) override;
  void setAxisAlignedBoundingBox(double entity, const Aabb& boundingBox) override;
  void scaleBoundingBox(double entity, double scale) override;
  void setPriority(double entity, double priority) override;
  void setCulling(double entity, bool enabled) override;
  double getMorphTargetCount(double entity) override;
  void setMorphWeights(double entity, const std::vector<double>& weights, double offset) override;
  std::shared_ptr<HybridMaterialInstanceSpec> getMaterialInstanceAt(double entity, double primitiveIndex) override;
  void setMaterialInstanceAt(double entity, double primitiveIndex, const std::shared_ptr<HybridMaterialInstanceSpec>& instance) override;

private:
  struct Renderable {
    ::filament::RenderableManager& manager;
    ::filament::RenderableManager::Instance instance;
  };

  Renderable renderable(double entity, const char* method);

  std::shared_ptr<EngineCore> engine_;
};

} // namespace margelo::nitro::filament
