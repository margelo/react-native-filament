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
  // Multiplies the matrix with the provided scale vector
  std::shared_ptr<TMat44Wrapper> scaling(std::vector<double> scale);
  // Translates the matrix by the provided translation vector
  std::shared_ptr<TMat44Wrapper> translate(std::vector<double> translation);
  // Rotates the matrix by the provided angle in radians around the provided axis
  std::shared_ptr<TMat44Wrapper> rotate(double angleRadians, std::vector<double> axisVec);
  // Returns the scale of the matrix
  std::vector<double> getScale();
  // Returns the translation of the matrix
  std::vector<double> getTranslation();

private:
  math::mat4f _matrix;
};
} // namespace margelo
