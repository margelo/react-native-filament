//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "jsi/HybridObject.h"
#include <btBulletDynamicsCommon.h>

namespace margelo {
class ShapeWrapper : public HybridObject {
public:
  explicit ShapeWrapper(const char* name, std::shared_ptr<btCollisionShape> shape) : HybridObject(name), _shape(shape){};

  std::shared_ptr<btCollisionShape> getShape() {
    return _shape;
  }

private:
  std::shared_ptr<btCollisionShape> _shape;
};
} // namespace margelo
