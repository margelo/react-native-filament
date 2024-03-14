//
// Created by Hanno Gödecke on 05.03.24.
//

#include "BulletWrapper.h"

namespace margelo {

void BulletWrapper::loadHybridMethods() {
  registerHybridMethod("createDiscreteDynamicWorld", &BulletWrapper::createDiscreteDynamicWorld, this);
  registerHybridMethod("createRigidBody", &BulletWrapper::createRigidBody, this);
}

std::shared_ptr<DiscreteDynamicWorldWrapper> BulletWrapper::createDiscreteDynamicWorld(double gravityX, double gravityY, double gravityZ) {
  Logger::log("BulletWrapper", "createDiscreteDynamicWorld %f %f %f", gravityX, gravityY, gravityZ);
  return std::make_shared<DiscreteDynamicWorldWrapper>(gravityX, gravityY, gravityZ);
}

std::shared_ptr<RigidBodyWrapper> BulletWrapper::createRigidBody(double mass, double x, double y, double z, double shapeX, double shapeY,
                                                                 double shapeZ) {
  Logger::log("BulletWrapper", "createRigidBody m:%f x:%f y:%f z:%f shapeX:%f shapeY:%f shapeZ:%f", mass, x, y, z, shapeX, shapeY, shapeZ);
  return std::make_shared<RigidBodyWrapper>(mass, x, y, z, shapeX, shapeY, shapeZ);
}
} // namespace margelo