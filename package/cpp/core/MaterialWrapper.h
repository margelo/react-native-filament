//
// Created by Hanno Gödecke on 25.03.24.
//

#pragma once

#include "jsi/HybridObject.h"

#include <filament/Material.h>

namespace margelo {

using namespace filament;

class MaterialWrapper : public HybridObject {
public:
  explicit MaterialWrapper(std::shared_ptr<Material> material) : HybridObject("MaterialWrapper"), _material(material) {}

  void loadHybridMethods() override{};

  std::shared_ptr<Material> getMaterial() {
    return _material;
  }

private:
  std::shared_ptr<Material> _material;
};
} // namespace margelo
