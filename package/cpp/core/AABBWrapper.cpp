//
// Created by Hanno Gödecke on 18.03.24.
//

#include "AABBWrapper.h"

namespace margelo {
void AABBWrapper::loadHybridMethods() {
  registerHybridGetter("center", &AABBWrapper::getCenter, this);
  registerHybridGetter("halfExtent", &AABBWrapper::getExtent, this);
}

std::vector<double> AABBWrapper::getCenter() {
  math::float3 center = _aabb.center();
  return {center.x, center.y, center.z};
}

std::vector<double> AABBWrapper::getExtent() {
  math::float3 extent = _aabb.extent();
  return {extent.x, extent.y, extent.z};
}
} // namespace margelo