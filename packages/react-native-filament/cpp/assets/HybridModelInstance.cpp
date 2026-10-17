#include "HybridModelInstance.hpp"

#include "HybridAnimator.hpp"

namespace margelo::nitro::filament {

HybridModelInstance::HybridModelInstance(std::shared_ptr<HybridEngine> engine, std::shared_ptr<ModelCore> core, size_t index)
    : HybridObject(TAG), core_(core), index_(index),
      animator_(std::make_shared<HybridAnimator>(std::move(engine), std::move(core), index)) {}

double HybridModelInstance::getRootEntity() {
  return snapshot().rootEntity;
}

std::vector<double> HybridModelInstance::getEntities() {
  return snapshot().entities;
}

std::shared_ptr<HybridAnimatorSpec> HybridModelInstance::getAnimator() {
  return animator_;
}

const ModelInstanceSnapshot& HybridModelInstance::snapshot() const {
  return core_->snapshot().instances[index_];
}

} // namespace margelo::nitro::filament
