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
  explicit TMat44Wrapper(const math::mat4f& matrix) : HybridObject("TMat44Wrapper"), _matrix(matrix) {}

  void loadHybridMethods() override;

  const filament::math::mat4f& getMat() {
    return _matrix;
  }

private:
  std::vector<double> getMatrixData();
  std::shared_ptr<TMat44Wrapper> scaling(std::vector<double> scale);
  std::vector<double> getScale();
  std::shared_ptr<TMat44Wrapper> copy();

private:
  math::mat4f _matrix;
};
} // namespace margelo
