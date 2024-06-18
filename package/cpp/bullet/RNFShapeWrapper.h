//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "jsi/RNFHybridObject.h"
#include <btBulletDynamicsCommon.h>

namespace margelo {

/**
 * Base class for all bullet collision shapes.
 * Every new collision shape we want to support in the API should be derived from this class.
 */
class ShapeWrapper : public HybridObject {
public:
  explicit ShapeWrapper(const char* name, std::shared_ptr<btCollisionShape> shape) : HybridObject(name), _shape(shape){};

  void loadHybridMethods() override;

  std::shared_ptr<btCollisionShape> getShape() {
    return _shape;
  }

private: // Public API
  std::vector<double> getLocalScaling();
  void setLocalScaling(const std::vector<double>& scaling);
  double getMargin();
  void setMargin(double margin);

private:
  std::shared_ptr<btCollisionShape> _shape;
};
} // namespace margelo
