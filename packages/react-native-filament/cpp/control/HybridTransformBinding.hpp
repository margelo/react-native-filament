#pragma once

#include "HybridTransformBindingSpec.hpp"
#include "TransformBindingCore.hpp"
#include "engine/EngineCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridTransformBinding final : public HybridTransformBindingSpec {
public:
  HybridTransformBinding(std::shared_ptr<EngineCore> engine, std::shared_ptr<TransformBindingCore> core);
  ~HybridTransformBinding() override;

  void setTranslation(double x, double y, double z) override;
  void setRotation(double x, double y, double z, double w) override;
  void setScale(double x, double y, double z) override;
  void dispose() override;

private:
  std::shared_ptr<EngineCore> engine_;
  std::shared_ptr<TransformBindingCore> core_;
};

} // namespace margelo::nitro::filament
