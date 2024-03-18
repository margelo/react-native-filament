//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "ShapeWrapper.h"

namespace margelo {

class CylinderShapeWrapperZ : public ShapeWrapper {
public:
  explicit CylinderShapeWrapperZ(double x, double y, double z)
      : ShapeWrapper("CylinderShapeWrapperZ", std::make_shared<btCylinderShapeZ>(btVector3(x, y, z))) {}
};

} // namespace margelo
