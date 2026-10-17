//
// Created by Hanno Gödecke on 18.03.24.
//

#include "RNFShapeWrapper.h"

namespace margelo {

void margelo::ShapeWrapper::loadHybridMethods() {
  registerHybridGetter("localScaling", &ShapeWrapper::getLocalScaling, this);
  registerHybridSetter("localScaling", &ShapeWrapper::setLocalScaling, this);
  registerHybridGetter("margin", &ShapeWrapper::getMargin, this);
  registerHybridSetter("margin", &ShapeWrapper::setMargin, this);
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