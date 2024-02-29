//
// Created by Hanno Gödecke on 29.02.24.
//

#pragma once

#include <math/vec3.h>

namespace margelo {

class Converter {
public:
  static math::float3 VecToFloat3(std::vector<double> vec) {
    if (vec.size() != 3) {
      throw std::invalid_argument("Point must have 3 elements");
    }

    return math::float3(vec[0], vec[1], vec[2]);
  }
};
} // namespace margelo
