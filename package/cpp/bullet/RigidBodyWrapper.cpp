//
// Created by Hanno Gödecke on 05.03.24.
//

#include "RigidBodyWrapper.h"

namespace margelo {
RigidBodyWrapper::RigidBodyWrapper(double mass, double x, double y, double z, double shapeX, double shapeY, double shapeZ) {
  btTransform transform;
  transform.setIdentity();
  transform.setOrigin(btVector3(x, y, z));

  btCollisionShape* shape = new btBoxShape(btVector3(shapeX, shapeY, shapeZ));

  btVector3 localInertia(0, 0, 0);
  if (mass != 0.0) {
    shape->calculateLocalInertia(mass, localInertia);
  }

  btDefaultMotionState* motionState = new btDefaultMotionState(transform);
  btRigidBody::btRigidBodyConstructionInfo rigidBodyCI(mass, motionState, shape, localInertia);
  _rigidBody = std::make_shared<btRigidBody>(rigidBodyCI);
}

void RigidBodyWrapper::loadHybridMethods() {}

} // namespace margelo