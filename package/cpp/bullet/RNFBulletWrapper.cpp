//
// Created by Hanno Gödecke on 05.03.24.
//

#include "RNFBulletWrapper.h"

namespace margelo {

void BulletWrapper::loadHybridMethods() {
  HybridObject::loadHybridMethods();
  registerHybrids(this, [](nitro::Prototype& proto) {
    proto.registerHybridMethod("createDiscreteDynamicWorld", &BulletWrapper::createDiscreteDynamicWorld);
    proto.registerHybridMethod("createRigidBody", &BulletWrapper::createRigidBody);
    proto.registerHybridMethod("createBoxShape", &BulletWrapper::createBoxShape);
    proto.registerHybridMethod("createCylinderShape", &BulletWrapper::createCylinderShape);
    proto.registerHybridMethod("createCylinderShapeX", &BulletWrapper::createCylinderShapeX);
    proto.registerHybridMethod("createCylinderShapeZ", &BulletWrapper::createCylinderShapeZ);
    proto.registerHybridMethod("createStaticPlaneShape", &BulletWrapper::createStaticPlaneShape);
    proto.registerHybridMethod("createRigidBodyFromTransform", &BulletWrapper::createRigidBodyFromTransform);
    proto.registerHybridMethod("createSphereShape", &BulletWrapper::createSphereShape);
  });
}

std::shared_ptr<DiscreteDynamicWorldWrapper> BulletWrapper::createDiscreteDynamicWorld(double gravityX, double gravityY, double gravityZ) {
  return std::make_shared<DiscreteDynamicWorldWrapper>(gravityX, gravityY, gravityZ);
}

std::shared_ptr<RigidBodyWrapper> BulletWrapper::createRigidBody(double mass, double x, double y, double z,
                                                                 const std::shared_ptr<ShapeWrapper>& shape, std::string id,
                                                                 const std::optional<CollisionCallback>& collisionCallback) {
  // Don't pass the shape wrapper, but the shape itself
  const auto& shapePtr = shape->getShape();
  if (shapePtr == nullptr) {
    throw std::runtime_error("Shape is null");
  }

  return RigidBodyWrapper::create(mass, x, y, z, shapePtr, id, collisionCallback);
}

std::shared_ptr<RigidBodyWrapper> BulletWrapper::createRigidBodyFromTransform(double mass,
                                                                              const std::shared_ptr<TMat44Wrapper>& entityTransform,
                                                                              const std::shared_ptr<ShapeWrapper>& shape, std::string id,
                                                                              const std::optional<CollisionCallback>& collisionCallback) {
  const auto& shapePtr = shape->getShape();
  if (shapePtr == nullptr) {
    throw std::runtime_error("Shape is null");
  }

  return RigidBodyWrapper::create(mass, entityTransform, shapePtr, id, collisionCallback);
}

std::shared_ptr<BoxShapeWrapper> BulletWrapper::createBoxShape(double x, double y, double z) {
  return std::make_shared<BoxShapeWrapper>(x, y, z);
}
std::shared_ptr<CylinderShapeWrapper> BulletWrapper::createCylinderShape(double x, double y, double z) {
  return std::make_shared<CylinderShapeWrapper>(x, y, z);
}
std::shared_ptr<CylinderShapeWrapperX> BulletWrapper::createCylinderShapeX(double x, double y, double z) {
  return std::make_shared<CylinderShapeWrapperX>(x, y, z);
}
std::shared_ptr<CylinderShapeWrapperZ> BulletWrapper::createCylinderShapeZ(double x, double y, double z) {
  return std::make_shared<CylinderShapeWrapperZ>(x, y, z);
}
std::shared_ptr<StaticPlaneShapeWrapper> BulletWrapper::createStaticPlaneShape(double normalX, double normalY, double normalZ,
                                                                               double planeConstant) {
  return std::make_shared<StaticPlaneShapeWrapper>(normalX, normalY, normalZ, planeConstant);
}
std::shared_ptr<SphereShapeWrapper> BulletWrapper::createSphereShape(double radius) {
  return std::make_shared<SphereShapeWrapper>(radius);
}
} // namespace margelo
