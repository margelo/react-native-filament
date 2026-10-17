#include "TransformBindingCore.hpp"

namespace margelo::nitro::filament {

TransformBindingCore::TransformBindingCore(utils::Entity entity, Trs initial) : entity_(entity), latest_(initial) {}

void TransformBindingCore::setTranslation(::filament::math::float3 translation) {
  write([&](Trs& trs) { trs.translation = translation; });
}

void TransformBindingCore::setRotation(::filament::math::quatf rotation) {
  write([&](Trs& trs) { trs.rotation = rotation; });
}

void TransformBindingCore::setScale(::filament::math::float3 scale) {
  write([&](Trs& trs) { trs.scale = scale; });
}

void TransformBindingCore::apply(::filament::TransformManager& transforms) {
  if (!dirty_.exchange(false)) {
    return;
  }
  Trs snapshot;
  {
    std::unique_lock lock(mutex_);
    snapshot = latest_;
  }
  ::filament::TransformManager::Instance instance = transforms.getInstance(entity_);
  if (instance.isValid()) {
    transforms.setTransform(instance, snapshot.compose());
  }
}

void TransformBindingCore::stop() {
  stopped_ = true;
}

bool TransformBindingCore::isStopped() const {
  return stopped_;
}

template <typename Update> void TransformBindingCore::write(Update&& update) {
  {
    std::unique_lock lock(mutex_);
    update(latest_);
  }
  dirty_ = true;
}

} // namespace margelo::nitro::filament
