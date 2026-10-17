#pragma once

#include <math/mat4.h>
#include <math/quat.h>
#include <math/vec3.h>

#include <tuple>
#include <utility>

namespace margelo::nitro::filament {

using Mat4Tuple = std::tuple<double, double, double, double, double, double, double, double, double, double, double, double, double, double,
                             double, double>;

inline ::filament::math::mat4f toMat4f(const Mat4Tuple& values) {
  return std::apply(
      [](auto... element) {
        float elements[16] = {static_cast<float>(element)...};
        return ::filament::math::mat4f(::filament::math::float4(elements[0], elements[1], elements[2], elements[3]),
                                       ::filament::math::float4(elements[4], elements[5], elements[6], elements[7]),
                                       ::filament::math::float4(elements[8], elements[9], elements[10], elements[11]),
                                       ::filament::math::float4(elements[12], elements[13], elements[14], elements[15]));
      },
      values);
}

inline Mat4Tuple fromMat4f(const ::filament::math::mat4f& m) {
  return {m[0][0], m[0][1], m[0][2], m[0][3], m[1][0], m[1][1], m[1][2], m[1][3],
          m[2][0], m[2][1], m[2][2], m[2][3], m[3][0], m[3][1], m[3][2], m[3][3]};
}

inline ::filament::math::float3 toFloat3(const std::tuple<double, double, double>& value) {
  auto [x, y, z] = value;
  return {static_cast<float>(x), static_cast<float>(y), static_cast<float>(z)};
}

inline ::filament::math::quatf toQuaternion(const std::tuple<double, double, double, double>& value) {
  auto [x, y, z, w] = value;
  return ::filament::math::quatf(static_cast<float>(w), static_cast<float>(x), static_cast<float>(y), static_cast<float>(z));
}

} // namespace margelo::nitro::filament
