#pragma once

#include "HybridTransformManagerSpec.hpp"
#include "engine/EngineCore.hpp"
#include "utils/MatrixConversion.hpp"

#include <filament/TransformManager.h>

#include <memory>

namespace margelo::nitro::filament {

class HybridTransformManager final : public HybridTransformManagerSpec {
public:
  explicit HybridTransformManager(std::shared_ptr<EngineCore> engine);

  Mat4Tuple getTransform(double entity) override;
  Mat4Tuple getWorldTransform(double entity) override;
  void setTransform(double entity, const Mat4Tuple& transform) override;
  void setTranslation(double entity, const std::tuple<double, double, double>& translation) override;
  void setRotation(double entity, const std::tuple<double, double, double, double>& rotation) override;
  void setScale(double entity, const std::tuple<double, double, double>& scale) override;
  std::optional<double> getParent(double entity) override;
  void setParent(double entity, std::optional<double> parent) override;
  void transformToUnitCube(double entity, const Aabb& boundingBox) override;
  void openLocalTransformTransaction() override;
  void commitLocalTransformTransaction() override;

private:
  ::filament::TransformManager& transforms(const char* method);

  std::shared_ptr<EngineCore> engine_;
};

} // namespace margelo::nitro::filament
