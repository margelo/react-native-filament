//
// Created by Hanno Gödecke on 20.04.24.
//

#include "RNFTransformManagerWrapper.h"

namespace margelo {

void TransformManagerWrapper::loadHybridMethods() {
  registerHybridMethod("getTransform", &TransformManagerWrapper::getTransform, this);
  registerHybridMethod("getWorldTransform", &TransformManagerWrapper::getWorldTransform, this);
  registerHybridMethod("openLocalTransformTransaction", &TransformManagerWrapper::openLocalTransformTransaction, this);
  registerHybridMethod("commitLocalTransformTransaction", &TransformManagerWrapper::commitLocalTransformTransaction, this);
  registerHybridMethod("setTransform", &TransformManagerWrapper::setTransform, this);
  registerHybridMethod("createIdentityMatrix", &TransformManagerWrapper::createIdentityMatrix, this);
  registerHybridMethod("setEntityPosition", &TransformManagerWrapper::setEntityPosition, this);
  registerHybridMethod("setEntityRotation", &TransformManagerWrapper::setEntityRotation, this);
  registerHybridMethod("setEntityScale", &TransformManagerWrapper::setEntityScale, this);
  registerHybridMethod("updateTransformByRigidBody", &TransformManagerWrapper::updateTransformByRigidBody, this);
  registerHybridMethod("transformToUnitCube", &TransformManagerWrapper::transformToUnitCube, this);
}
std::shared_ptr<TMat44Wrapper> TransformManagerWrapper::getTransform(std::shared_ptr<EntityWrapper> entityWrapper) {
  Entity entity = getEntity(entityWrapper);
  return pointee()->getTransform(entity);
}
std::shared_ptr<TMat44Wrapper> TransformManagerWrapper::getWorldTransform(std::shared_ptr<EntityWrapper> entityWrapper) {
  Entity entity = getEntity(entityWrapper);
  return pointee()->getWorldTransform(entity);
}
void TransformManagerWrapper::openLocalTransformTransaction() {
  pointee()->openLocalTransformTransaction();
}
void TransformManagerWrapper::commitLocalTransformTransaction() {
  pointee()->commitLocalTransformTransaction();
}
void TransformManagerWrapper::setTransform(std::shared_ptr<EntityWrapper> entityWrapper, std::shared_ptr<TMat44Wrapper> transform) {
  Entity entity = getEntity(entityWrapper);
  pointee()->setTransform(entity, transform);
}
std::shared_ptr<TMat44Wrapper> TransformManagerWrapper::createIdentityMatrix() {
  return pointee()->createIdentityMatrix();
}
void TransformManagerWrapper::setEntityPosition(std::shared_ptr<EntityWrapper> entityWrapper, std::vector<double> positionVec,
                                                bool multiplyCurrent) {
  Entity entity = getEntity(entityWrapper);
  pointee()->setEntityPosition(entity, positionVec, multiplyCurrent);
}
void TransformManagerWrapper::setEntityRotation(std::shared_ptr<EntityWrapper> entityWrapper, double angleRadians,
                                                std::vector<double> axisVec, bool multiplyCurrent) {
  Entity entity = getEntity(entityWrapper);
  pointee()->setEntityRotation(entity, angleRadians, axisVec, multiplyCurrent);
}
void TransformManagerWrapper::setEntityScale(std::shared_ptr<EntityWrapper> entityWrapper, std::vector<double> scaleVec,
                                             bool multiplyCurrent) {
  Entity entity = getEntity(entityWrapper);
  pointee()->setEntityScale(entity, scaleVec, multiplyCurrent);
}
void TransformManagerWrapper::updateTransformByRigidBody(std::shared_ptr<EntityWrapper> entityWrapper,
                                                         std::shared_ptr<RigidBodyWrapper> rigidBody) {
  Entity entity = getEntity(entityWrapper);
  pointee()->updateTransformByRigidBody(entity, rigidBody);
}
void TransformManagerWrapper::transformToUnitCube(std::shared_ptr<EntityWrapper> rootEntityWrapper,
                                                  std::shared_ptr<AABBWrapper> aabbWrapper) {
  if (!aabbWrapper) {
    [[unlikely]];
    throw std::invalid_argument("AABB is null");
  }

  Aabb aabb = aabbWrapper->getAabb();
  Entity rootEntity = getEntity(rootEntityWrapper);

  pointee()->transformToUnitCube(rootEntity, aabb);
}

Entity TransformManagerWrapper::getEntity(std::shared_ptr<EntityWrapper> entityWrapper) {
  if (!entityWrapper) {
    [[unlikely]];
    throw std::invalid_argument("Entity is null");
  }
  return entityWrapper->getEntity();
}

} // namespace margelo