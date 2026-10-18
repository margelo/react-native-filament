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

void TransformBindingCore::setBase(const ::filament::math::mat4f& base) {
  {
    std::unique_lock lock(mutex_);
    base_ = base;
  }
  dirty_ = true;
}

void TransformBindingCore::apply(::filament::TransformManager& transforms) {
  if (!dirty_.exchange(false)) {
    return;
  }
  ::filament::math::mat4f transform;
  {
    std::unique_lock lock(mutex_);
    transform = latest_.compose() * base_;
  }
  ::filament::TransformManager::Instance instance = transforms.getInstance(entity_);
  if (instance.isValid()) {
    transforms.setTransform(instance, transform);
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
