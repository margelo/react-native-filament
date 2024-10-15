//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#if __has_include(<NitroModules/HybridObject.hpp>)
#include <NitroModules/HybridObject.hpp>
#else
#error NitroModules cannot be found! Are you sure you installed NitroModules properly?
#endif
#include <btBulletDynamicsCommon.h>

namespace margelo {

/**
 * Base class for all bullet collision shapes.
 * Every new collision shape we want to support in the API should be derived from this class.
 */
class ShapeWrapper : public nitro::HybridObject {
public:
  explicit ShapeWrapper(const char* name, std::shared_ptr<btCollisionShape> shape) : HybridObject(name), _shape(shape) {};

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
