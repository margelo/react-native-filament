//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "ShapeWrapper.h"

namespace margelo {

class SphereShapeWrapper : public ShapeWrapper {
public:
  explicit SphereShapeWrapper(double radius) : ShapeWrapper("SphereShapeWrapper", std::make_shared<btSphereShape>(radius)) {}
};

} // namespace margelo
