#pragma once

#include <math/mat4.h>
#include <math/quat.h>
#include <math/vec3.h>

namespace margelo::nitro::filament {

struct Trs {
  static Trs decompose(const ::filament::math::mat4f& transform);

  ::filament::math::mat4f compose() const;

  ::filament::math::float3 translation;
  ::filament::math::quatf rotation;
  ::filament::math::float3 scale;
};

} // namespace margelo::nitro::filament
