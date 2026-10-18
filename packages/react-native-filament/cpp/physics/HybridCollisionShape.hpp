#pragma once

#include "CollisionShapeCore.hpp"
#include "HybridCollisionShapeSpec.hpp"
#include "engine/EngineCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridCollisionShape final : public HybridCollisionShapeSpec {
public:
  static std::shared_ptr<HybridCollisionShapeSpec> of(const std::shared_ptr<EngineCore>& engine,
                                                      const std::shared_ptr<CollisionShapeCore>& core);

  HybridCollisionShape(std::shared_ptr<EngineCore> engine, std::shared_ptr<CollisionShapeCore> core);

  CollisionShapeType getType() override;
  std::tuple<double, double, double> getLocalScaling() override;
  void setLocalScaling(const std::tuple<double, double, double>& localScaling) override;
  double getMargin() override;
  void setMargin(double margin) override;
  void dispose() override;

  const std::shared_ptr<EngineCore>& engineCore() const;
  const std::shared_ptr<CollisionShapeCore>& core() const;

private:
  btCollisionShape& usable(const char* method);

  std::shared_ptr<EngineCore> engine_;
  std::shared_ptr<CollisionShapeCore> core_;
};

} // namespace margelo::nitro::filament
