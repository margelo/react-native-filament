#pragma once

#include "HybridValueBindingSpec.hpp"
#include "engine/EngineCore.hpp"

#include <atomic>
#include <memory>

namespace margelo::nitro::filament {

class HybridValueBinding final : public HybridValueBindingSpec {
public:
  HybridValueBinding(std::shared_ptr<EngineCore> engine, double initialValue);

  double getValue() override;
  void set(double value) override;

private:
  std::shared_ptr<EngineCore> engine_;
  std::atomic<double> value_;
};

} // namespace margelo::nitro::filament
