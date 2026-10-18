#pragma once

#include <LinearMath/btQuaternion.h>
#include <LinearMath/btTransform.h>
#include <LinearMath/btVector3.h>
#include <math/mat4.h>

#include <tuple>

namespace margelo::nitro::filament {

inline btVector3 toBtVector3(const std::tuple<double, double, double>& value) {
  auto [x, y, z] = value;
  return {static_cast<btScalar>(x), static_cast<btScalar>(y), static_cast<btScalar>(z)};
}

inline std::tuple<double, double, double> fromBtVector3(const btVector3& value) {
  return {value.x(), value.y(), value.z()};
}

inline btQuaternion toBtQuaternion(const std::tuple<double, double, double, double>& value) {
  auto [x, y, z, w] = value;
  return {static_cast<btScalar>(x), static_cast<btScalar>(y), static_cast<btScalar>(z), static_cast<btScalar>(w)};
}

inline ::filament::math::mat4f toMat4f(const btTransform& transform) {
  ::filament::math::mat4f result;
  transform.getOpenGLMatrix(&result[0][0]);
  return result;
}

inline btTransform toBtTransform(const ::filament::math::mat4f& matrix) {
  ::filament::math::mat4f unscaled = matrix;
  for (int column = 0; column < 3; column++) {
    unscaled[column].xyz = normalize(unscaled[column].xyz);
  }
  btTransform transform;
  transform.setFromOpenGLMatrix(&unscaled[0][0]);
  return transform;
}

} // namespace margelo::nitro::filament
