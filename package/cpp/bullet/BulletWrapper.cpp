//
// Created by Hanno Gödecke on 05.03.24.
//

#include "BulletWrapper.h"

namespace margelo {

void BulletWrapper::loadHybridMethods() {
  registerHybridMethod("createDiscreteDynamicWorld", &BulletWrapper::createDiscreteDynamicWorld, this);
  registerHybridMethod("createRigidBody", &BulletWrapper::createRigidBody, this);
  registerHybridMethod("createBoxShape", &BulletWrapper::createBoxShape, this);
}

std::shared_ptr<DiscreteDynamicWorldWrapper> BulletWrapper::createDiscreteDynamicWorld(double gravityX, double gravityY, double gravityZ) {
  return std::make_shared<DiscreteDynamicWorldWrapper>(gravityX, gravityY, gravityZ);
}

std::shared_ptr<RigidBodyWrapper> BulletWrapper::createRigidBody(double mass, double x, double y, double z,
                                                                 std::shared_ptr<ShapeWrapper<btCollisionShape>> shape) {
  // Don't pass the shape wrapper, but the shape itself
  std::shared_ptr<btCollisionShape> shapePtr = shape->getShape();
  if (shapePtr == nullptr) {
    throw std::runtime_error("Shape is null");
  }

  return std::make_shared<RigidBodyWrapper>(mass, x, y, z, shapePtr);
}
std::shared_ptr<BoxShapeWrapper> BulletWrapper::createBoxShape(double x, double y, double z) {
  return std::make_shared<BoxShapeWrapper>(x, y, z);
}
} // namespace margelo