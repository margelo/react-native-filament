//
// Created by Hanno Gödecke on 18.03.24.
//

#include "BoxWrapper.h"

namespace margelo {
void BoxWrapper::loadHybridMethods() {
  registerHybridGetter("center", &BoxWrapper::getCenter, this);
  registerHybridGetter("halfExtent", &BoxWrapper::getHalfExtent, this);
  registerHybridGetter("min", &BoxWrapper::getMin, this);
  registerHybridGetter("max", &BoxWrapper::getMax, this);
}

std::vector<double> BoxWrapper::getCenter() {
  math::float3 center = _box.center;
  return {center.x, center.y, center.z};
}

std::vector<double> BoxWrapper::getHalfExtent() {
  math::float3 extent = _box.halfExtent;
  return {extent.x, extent.y, extent.z};
}

std::vector<double> BoxWrapper::getMin() {
  math::float3 min = _box.getMin();
  return {min.x, min.y, min.z};
}

std::vector<double> BoxWrapper::getMax() {
  math::float3 max = _box.getMax();
  return {max.x, max.y, max.z};
}
} // namespace margelo