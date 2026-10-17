#include "TransformBindings.hpp"

#include "TransformBindingCore.hpp"

namespace margelo::nitro::filament {

void TransformBindings::add(const std::shared_ptr<TransformBindingCore>& binding) {
  bindings_.push_back(binding);
}

void TransformBindings::apply(::filament::TransformManager& transforms) {
  std::erase_if(bindings_, [&](const std::weak_ptr<TransformBindingCore>& weak) {
    std::shared_ptr<TransformBindingCore> binding = weak.lock();
    if (binding == nullptr || binding->isStopped()) {
      return true;
    }
    binding->apply(transforms);
    return false;
  });
}

void TransformBindings::clear() {
  bindings_.clear();
}

} // namespace margelo::nitro::filament
