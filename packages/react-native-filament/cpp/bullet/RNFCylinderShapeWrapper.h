//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "RNFShapeWrapper.h"

namespace margelo {

class CylinderShapeWrapper : public ShapeWrapper {
public:
  explicit CylinderShapeWrapper(double x, double y, double z)
      : ShapeWrapper("CylinderShapeWrapper", std::make_shared<btCylinderShape>(btVector3(x, y, z))) {}
};

} // namespace margelo
