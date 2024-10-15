//
// Created by Hanno Gödecke on 18.03.24.
//

#include "RNFBoxWrapper.h"

namespace margelo {
void BoxWrapper::loadHybridMethods() {
  HybridObject::loadHybridMethods();
  registerHybrids(this, [](nitro::Prototype& proto) {
    proto.registerHybridGetter("center", &BoxWrapper::getCenter);
    proto.registerHybridGetter("halfExtent", &BoxWrapper::getHalfExtent);
    proto.registerHybridGetter("min", &BoxWrapper::getMin);
    proto.registerHybridGetter("max", &BoxWrapper::getMax);
  });
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