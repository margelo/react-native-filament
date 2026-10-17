#include "Trs.hpp"

#include <math/mat3.h>

namespace margelo::nitro::filament {

using ::filament::math::float3;
using ::filament::math::mat3f;
using ::filament::math::mat4f;
using ::filament::math::quatf;

Trs Trs::decompose(const mat4f& transform) {
  mat3f basis = transform.upperLeft();
  float3 scale = {length(basis[0]), length(basis[1]), length(basis[2])};
  if (det(basis) < 0) {
    scale.x = -scale.x;
  }
  quatf rotation = quatf(1, 0, 0, 0);
  if (scale.x != 0 && scale.y != 0 && scale.z != 0) {
    rotation = normalize(mat3f(basis[0] / scale.x, basis[1] / scale.y, basis[2] / scale.z).toQuaternion());
  }
  return {.translation = transform[3].xyz, .rotation = rotation, .scale = scale};
}

mat4f Trs::compose() const {
  return mat4f::translation(translation) * mat4f(rotation) * mat4f::scaling(scale);
}

} // namespace margelo::nitro::filament
