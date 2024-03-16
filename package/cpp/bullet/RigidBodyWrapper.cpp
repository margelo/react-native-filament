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

std::shared_ptr<RigidBodyWrapper> RigidBodyWrapper::create(double mass, std::shared_ptr<TMat44Wrapper> entityTransform,
                                                           std::shared_ptr<btCollisionShape> shape) {
  // EntityTransform to openGL matrix:
  const filament::math::mat4f& mat = entityTransform->getMat();

  //  btTransform& bodyTransform = rigidBody->getRigidBody()->getWorldTransform();
  //  btScalar bodyTransformMatrix[16];
  //  bodyTransform.getOpenGLMatrix(bodyTransformMatrix);
  //
  //  filament::math::mat4f filamentMatrix(bodyTransformMatrix[0], bodyTransformMatrix[1], bodyTransformMatrix[2], bodyTransformMatrix[3],
  //                                       bodyTransformMatrix[4], bodyTransformMatrix[5], bodyTransformMatrix[6], bodyTransformMatrix[7],
  //                                       bodyTransformMatrix[8], bodyTransformMatrix[9], bodyTransformMatrix[10], bodyTransformMatrix[11],
  //                                       bodyTransformMatrix[12], bodyTransformMatrix[13], bodyTransformMatrix[14],
  //                                       bodyTransformMatrix[15]);

  // convert filament matrix to row-major
  auto matArray = mat.asArray();
  btMatrix3x3 basis;
  //  basis.setValue(matArray[0], matArray[1], matArray[2], matArray[4], matArray[5], matArray[6], matArray[8], matArray[9], matArray[10]);
  basis.setValue(mat[0][0], mat[0][1], mat[0][2], mat[1][0], mat[1][1], mat[1][2], mat[2][0], mat[2][1], mat[2][2]);

  btTransform transform;
  transform.setBasis(basis);
  transform.setOrigin(btVector3(matArray[12], matArray[13], matArray[14]));

  auto motionState = std::make_unique<btDefaultMotionState>(transform);
  return std::make_shared<RigidBodyWrapper>(mass, shape, std::move(motionState));
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