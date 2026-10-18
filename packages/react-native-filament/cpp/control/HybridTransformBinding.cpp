#include "HybridTransformBinding.hpp"

#include "utils/MatrixConversion.hpp"

namespace margelo::nitro::filament {

HybridTransformBinding::HybridTransformBinding(std::shared_ptr<EngineCore> engine, std::shared_ptr<TransformBindingCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

HybridTransformBinding::~HybridTransformBinding() {
  core_->stop();
}

void HybridTransformBinding::setTranslation(double x, double y, double z) {
  if (core_->isStopped()) {
    return;
  }
  core_->setTranslation({static_cast<float>(x), static_cast<float>(y), static_cast<float>(z)});
  engine_->requestFrame();
}

void HybridTransformBinding::setRotation(double x, double y, double z, double w) {
  if (core_->isStopped()) {
    return;
  }
  core_->setRotation(
      normalize(::filament::math::quatf(static_cast<float>(w), static_cast<float>(x), static_cast<float>(y), static_cast<float>(z))));
  engine_->requestFrame();
}

void HybridTransformBinding::setScale(double x, double y, double z) {
  if (core_->isStopped()) {
    return;
  }
  core_->setScale({static_cast<float>(x), static_cast<float>(y), static_cast<float>(z)});
  engine_->requestFrame();
}

void HybridTransformBinding::setBase(const Mat4Tuple& transform) {
  if (core_->isStopped()) {
    return;
  }
  core_->setBase(toMat4f(transform));
  engine_->requestFrame();
}

void HybridTransformBinding::dispose() {
  core_->stop();
}

} // namespace margelo::nitro::filament
