//
// Created by Hanno Gödecke on 17.04.24.
//

#pragma once

#include "MaterialImpl.h"
#include "jsi/PointerHolder.h"

namespace margelo {

class MaterialWrapper : public PointerHolder<MaterialImpl> {
public:
  explicit MaterialWrapper(std::shared_ptr<MaterialImpl> material) : PointerHolder("MaterialWrapper", material) {}

  void loadHybridMethods() override;

public: // Public JS API
  std::shared_ptr<MaterialInstanceWrapper> createInstance();
  std::shared_ptr<MaterialInstanceWrapper> getDefaultInstance();
  void setDefaultParameter(std::string name, double value);
  void setBaseColorSRGB(std::vector<double> rgba);
};

} // namespace margelo
