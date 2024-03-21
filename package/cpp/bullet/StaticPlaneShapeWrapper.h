//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "ShapeWrapper.h"

namespace margelo {

class StaticPlaneShapeWrapper : public ShapeWrapper {
public:
  explicit StaticPlaneShapeWrapper(double x, double y, double z, double planeConstant)
      : ShapeWrapper("StaticPlaneShapeWrapper", std::make_shared<btStaticPlaneShape>(btVector3(x, y, z), planeConstant)) {}
};

} // namespace margelo
