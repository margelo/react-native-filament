//
// Created by Hanno Gödecke on 05.03.24.
//

#include "RigidBodyWrapper.h"
#include "jsi/EnumMapper.h"
#include "ActivationStateEnum.h"

namespace margelo {
RigidBodyWrapper::RigidBodyWrapper(double mass, double x, double y, double z, double shapeX, double shapeY, double shapeZ)
    : HybridObject("RigidBodyWrapper") {
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

void RigidBodyWrapper::loadHybridMethods() {
  registerHybridMethod("setDamping", &RigidBodyWrapper::setDamping, this);
  registerHybridSetter("friction", &RigidBodyWrapper::setFriction, this);
  registerHybridGetter("friction", &RigidBodyWrapper::getFriction, this);
  registerHybridSetter("activationState", &RigidBodyWrapper::setActivationState, this);
  registerHybridGetter("activationState", &RigidBodyWrapper::getActivationState, this);
}

void RigidBodyWrapper::setDamping(double linearDamping, double angularDamping) {
  _rigidBody->setDamping(linearDamping, angularDamping);
}

void RigidBodyWrapper::setFriction(double friction) {
  _rigidBody->setFriction(friction);
}

double RigidBodyWrapper::getFriction() {
  return _rigidBody->getFriction();
}

void RigidBodyWrapper::setActivationState(std::string activationState) {
  ActivationState state;
  EnumMapper::convertJSUnionToEnum(activationState, &state);

  _rigidBody->setActivationState(static_cast<int>(state));
}

std::string RigidBodyWrapper::getActivationState() {
  ActivationState state = static_cast<ActivationState>(_rigidBody->getActivationState());
  std::string stateString;
  EnumMapper::convertEnumToJSUnion(state, &stateString);

  return stateString;
}

} // namespace margelo