//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "RNFShapeWrapper.h"

namespace margelo {

class CylinderShapeWrapperZ : public ShapeWrapper {
public:
  explicit CylinderShapeWrapperZ(double x, double y, double z)
      : ShapeWrapper("CylinderShapeWrapperZ", std::make_shared<btCylinderShapeZ>(btVector3(x, y, z))) {}
};

} // namespace margelo
