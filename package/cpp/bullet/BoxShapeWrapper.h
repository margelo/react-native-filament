//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "ShapeWrapper.h"

namespace margelo {

class BoxShapeWrapper : public ShapeWrapper {
public:
  explicit BoxShapeWrapper(double x, double y, double z)
      : ShapeWrapper("BoxShapeWrapper", std::make_shared<btBoxShape>(btVector3(x, y, z))) {}
};

} // namespace margelo
