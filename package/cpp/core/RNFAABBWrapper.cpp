//
// Created by Hanno Gödecke on 18.03.24.
//

#include "RNFAABBWrapper.h"

namespace margelo {
void AABBWrapper::loadHybridMethods() {
  HybridObject::loadHybridMethods();
  registerHybrids(this, [](nitro::Prototype& proto) {
    proto.registerHybridGetter("center", &AABBWrapper::getCenter);
    proto.registerHybridGetter("halfExtent", &AABBWrapper::getHalfExtent);
    proto.registerHybridGetter("min", &AABBWrapper::getMin);
    proto.registerHybridGetter("max", &AABBWrapper::getMax);
  });
}

std::vector<double> AABBWrapper::getCenter() {
  math::float3 center = _aabb.center();
  return {center.x, center.y, center.z};
}

std::vector<double> AABBWrapper::getHalfExtent() {
  math::float3 extent = _aabb.extent();
  return {extent.x, extent.y, extent.z};
}

std::vector<double> AABBWrapper::getMin() {
  math::float3 min = _aabb.min;
  return {min.x, min.y, min.z};
}

std::vector<double> AABBWrapper::getMax() {
  math::float3 max = _aabb.max;
  return {max.x, max.y, max.z};
}
} // namespace margelo
