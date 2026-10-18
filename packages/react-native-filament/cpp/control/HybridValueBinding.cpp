#include "HybridValueBinding.hpp"

namespace margelo::nitro::filament {

HybridValueBinding::HybridValueBinding(std::shared_ptr<EngineCore> engine, double initialValue)
    : HybridObject(TAG), engine_(std::move(engine)), value_(initialValue) {}

double HybridValueBinding::getValue() {
  return value_;
}

void HybridValueBinding::set(double value) {
  value_ = value;
  engine_->requestFrame();
}

} // namespace margelo::nitro::filament
