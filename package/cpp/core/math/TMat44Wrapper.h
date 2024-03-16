//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "jsi/HybridObject.h"
#include <math/mat4.h>

namespace margelo {
using namespace filament;

class TMat44Wrapper : public HybridObject {
public:
  explicit TMat44Wrapper(const filament::math::mat4f& mat) : HybridObject("TMat44Wrapper"), _mat(mat) {}

  void loadHybridMethods() override;

  const filament::math::mat4f& getMat() {
    return _mat;
  }

private:
  std::vector<double> getMatrixData();
  std::shared_ptr<TMat44Wrapper> scaling(double x, double y, double z);

private:
  const math::mat4f& _mat;
};
} // namespace margelo
