//
// Created by Hanno Gödecke on 18.03.24.
//

#include "RNFShapeWrapper.h"

namespace margelo {

void margelo::ShapeWrapper::loadHybridMethods() {
  HybridObject::loadHybridMethods();
  registerHybrids(this, [](nitro::Prototype& proto) {
    proto.registerHybridGetter("localScaling", &ShapeWrapper::getLocalScaling);
    proto.registerHybridSetter("localScaling", &ShapeWrapper::setLocalScaling);
    proto.registerHybridGetter("margin", &ShapeWrapper::getMargin);
    proto.registerHybridSetter("margin", &ShapeWrapper::setMargin);
  });
}

std::vector<double> ShapeWrapper::getLocalScaling() {
  btVector3 scaling = _shape->getLocalScaling();
  return {scaling.x(), scaling.y(), scaling.z()};
}

void ShapeWrapper::setLocalScaling(const std::vector<double>& scaling) {
  _shape->setLocalScaling(btVector3(scaling[0], scaling[1], scaling[2]));
}

double ShapeWrapper::getMargin() {
  return _shape->getMargin();
}

void ShapeWrapper::setMargin(double margin) {
  _shape->setMargin(margin);
}
} // namespace margelo