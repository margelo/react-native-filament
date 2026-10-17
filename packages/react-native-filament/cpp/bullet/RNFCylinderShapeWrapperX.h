//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "RNFShapeWrapper.h"

namespace margelo {

class CylinderShapeWrapperX : public ShapeWrapper {
public:
  explicit CylinderShapeWrapperX(double x, double y, double z)
      : ShapeWrapper("CylinderShapeWrapperX", std::make_shared<btCylinderShapeX>(btVector3(x, y, z))) {}
};

} // namespace margelo
