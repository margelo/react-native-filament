//
// Created by Hanno Gödecke on 25.03.24.
//

#pragma once

#include "MaterialInstanceWrapper.h"
#include "jsi/HybridObject.h"

#include <filament/Material.h>

namespace margelo {

using namespace filament;

class MaterialWrapper : public HybridObject {
public:
  explicit MaterialWrapper(std::shared_ptr<Material> material) : HybridObject("MaterialWrapper"), _material(material) {}

  void loadHybridMethods() override;

  const std::shared_ptr<Material>& getMaterial() {
    return _material;
  }

  const std::vector<std::shared_ptr<MaterialInstanceWrapper>>& getInstances() {
    return _instances;
  }

private:
  std::shared_ptr<MaterialInstanceWrapper> createInstance();
  std::shared_ptr<MaterialInstanceWrapper> getDefaultInstance();
  void setDefaultParameter(std::string name, double value);

private:
  std::shared_ptr<Material> _material;
  // Keep track of all instances
  std::vector<std::shared_ptr<MaterialInstanceWrapper>> _instances;
};
} // namespace margelo
