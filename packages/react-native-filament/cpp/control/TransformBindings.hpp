#pragma once

#include <filament/TransformManager.h>

#include <memory>
#include <vector>

namespace margelo::nitro::filament {

class TransformBindingCore;

class TransformBindings final {
public:
  void add(const std::shared_ptr<TransformBindingCore>& binding);
  void apply(::filament::TransformManager& transforms);
  void clear();

private:
  std::vector<std::weak_ptr<TransformBindingCore>> bindings_;
};

} // namespace margelo::nitro::filament
