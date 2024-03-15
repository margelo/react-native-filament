//
// Created by Hanno Gödecke on 05.03.24.
//

#include "RigidBodyWrapper.h"
#include "ActivationStateEnum.h"
#include "jsi/EnumMapper.h"

namespace margelo {
RigidBodyWrapper::RigidBodyWrapper(double mass, std::shared_ptr<btCollisionShape> shape, std::unique_ptr<btMotionState> motionState)
    : HybridObject("RigidBodyWrapper") {
  _shape = shape;
  _motionState = std::move(motionState);

  btVector3 localInertia(0, 0, 0);
  if (mass != 0.0) {
    _shape->calculateLocalInertia(mass, localInertia);
  }

  btRigidBody::btRigidBodyConstructionInfo rigidBodyCI(mass, _motionState.get(), _shape.get(), localInertia);
  _rigidBody = std::make_shared<btRigidBody>(rigidBodyCI);
}

std::shared_ptr<RigidBodyWrapper> RigidBodyWrapper::create(double mass, double x, double y, double z,
                                                           std::shared_ptr<btCollisionShape> shape) {
  btTransform transform;
  transform.setIdentity();
  transform.setOrigin(btVector3(x, y, z));
  auto motionState = std::make_unique<btDefaultMotionState>(transform);
  return std::make_shared<RigidBodyWrapper>(mass, shape, std::move(motionState));
}

std::shared_ptr<RigidBodyWrapper> RigidBodyWrapper::create(double mass, std::unique_ptr<FilamentAssetWrapper> assetWrapper,
                                                           std::shared_ptr<btCollisionShape> shape) {
  assetWrapper->getAsset()->getBoundingBox();
  return std::shared_ptr<RigidBodyWrapper>();
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