//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "jsi/HybridObject.h"
#include <btBulletDynamicsCommon.h>

namespace margelo {
template <typename T> class ShapeWrapper : public HybridObject {
public:
  explicit ShapeWrapper(const char* name, std::shared_ptr<T> shape) : HybridObject(name), _shape(shape){};

  std::shared_ptr<T> getShape() {
    return _shape;
  }

private:
  std::shared_ptr<T> _shape;
};
} // namespace margelo
