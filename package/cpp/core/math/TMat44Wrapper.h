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

  void loadHybridMethods() override {
    registerHybridGetter("data", &TMat44Wrapper::getMatrixData, this);
  }

  const filament::math::mat4f& getMat() {
    return _mat;
  }

private:
  std::vector<double> getMatrixData() {
    std::vector<double> data;
    data.reserve(16);
    const float* array = _mat.asArray();
    for (int i = 0; i < 16; i++) {
      data.push_back((double)array[i]);
    }
    return data;
  }

private:
  const math::mat4f& _mat;
};
} // namespace margelo
