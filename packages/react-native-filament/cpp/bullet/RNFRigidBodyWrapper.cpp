//
// Created by Hanno Gödecke on 05.03.24.
//

#include "RNFRigidBodyWrapper.h"
#include "RNFActivationStateEnum.h"
#include "jsi/RNFEnumMapper.h"

namespace margelo {
RigidBodyWrapper::RigidBodyWrapper(double mass, std::shared_ptr<btCollisionShape> shape, std::unique_ptr<btMotionState> motionState,
                                   std::string id, std::optional<CollisionCallback> collisionCallback)
    : HybridObject("RigidBodyWrapper") {
  _shape = shape;
  _motionState = std::move(motionState);
  _id = id;
  // The collision callback is coming from JS , thus we move it to the class member
  _collisionCallback = std::move(collisionCallback);

  btVector3 localInertia(0, 0, 0);
  if (mass != 0.0) {
    _shape->calculateLocalInertia(mass, localInertia);
  }

  btRigidBody::btRigidBodyConstructionInfo rigidBodyCI(mass, _motionState.get(), _shape.get(), localInertia);
  _rigidBody = std::make_shared<btRigidBody>(rigidBodyCI);
}

std::shared_ptr<RigidBodyWrapper> RigidBodyWrapper::create(double mass, double x, double y, double z,
                                                           std::shared_ptr<btCollisionShape> shape, std::string id,
                                                           std::optional<CollisionCallback> collisionCallback) {
  btTransform transform;
  transform.setIdentity();
  transform.setOrigin(btVector3(x, y, z));
  auto motionState = std::make_unique<btDefaultMotionState>(transform);
  return std::make_shared<RigidBodyWrapper>(mass, shape, std::move(motionState), id, collisionCallback);
}

std::shared_ptr<RigidBodyWrapper> RigidBodyWrapper::create(double mass, std::shared_ptr<TMat44Wrapper> entityTransform,
                                                           std::shared_ptr<btCollisionShape> shape, std::string id,
                                                           std::optional<CollisionCallback> collisionCallback) {
  // EntityTransform to openGL matrix:
  const filament::math::mat4f& mat = entityTransform->getMat();

  //  Convert the filament column-major matrix to a row-major matrix:
  btScalar openGlMatrix[16];
  openGlMatrix[0] = mat[0][0];
  openGlMatrix[1] = mat[0][1];
  openGlMatrix[2] = mat[0][2];
  openGlMatrix[3] = mat[0][3];
  openGlMatrix[4] = mat[1][0];
  openGlMatrix[5] = mat[1][1];
  openGlMatrix[6] = mat[1][2];
  openGlMatrix[7] = mat[1][3];
  openGlMatrix[8] = mat[2][0];
  openGlMatrix[9] = mat[2][1];
  openGlMatrix[10] = mat[2][2];
  openGlMatrix[11] = mat[2][3];
  openGlMatrix[12] = mat[3][0];
  openGlMatrix[13] = mat[3][1];
  openGlMatrix[14] = mat[3][2];
  openGlMatrix[15] = mat[3][3];

  // Create the transform from the openGL matrix:
  btTransform transform;
  transform.setFromOpenGLMatrix(openGlMatrix);

  // Set the transform to the motion state and make a new RigidBodyWrapper:
  auto motionState = std::make_unique<btDefaultMotionState>(transform);
  return std::make_shared<RigidBodyWrapper>(mass, shape, std::move(motionState), id, collisionCallback);
}

void RigidBodyWrapper::loadHybridMethods() {
  registerHybridMethod("setDamping", &RigidBodyWrapper::setDamping, this);
  registerHybridSetter("friction", &RigidBodyWrapper::setFriction, this);
  registerHybridGetter("friction", &RigidBodyWrapper::getFriction, this);
  registerHybridSetter("activationState", &RigidBodyWrapper::setActivationState, this);
  registerHybridGetter("activationState", &RigidBodyWrapper::getActivationState, this);
  registerHybridGetter("id", &RigidBodyWrapper::getId, this);
  registerHybridSetter("id", &RigidBodyWrapper::setId, this);
  registerHybridMethod("setCollisionCallback", &RigidBodyWrapper::setCollisionCallback, this);
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
void RigidBodyWrapper::setId(std::string id) {
  _id = id;
}

std::string RigidBodyWrapper::getId() {
  return _id;
}

void RigidBodyWrapper::setCollisionCallback(std::optional<CollisionCallback> callback) {
  _collisionCallback = std::move(callback);
}
std::optional<CollisionCallback> RigidBodyWrapper::getCollisionCallback() {
  return _collisionCallback;
}

} // namespace margelo
