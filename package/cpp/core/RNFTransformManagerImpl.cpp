//
// Created by Hanno Gödecke on 15.03.24.
//

#include "RNFTransformManagerImpl.h"
#include "RNFAABBWrapper.h"
#include "core/utils/RNFConverter.h"
#include <filament/TransformManager.h>
#include <math/mat4.h>
#include <utils/EntityInstance.h>

namespace margelo {

std::shared_ptr<TMat44Wrapper> TransformManagerImpl::getTransform(Entity entity) {
  TransformManager& transformManager = _engine->getTransformManager();
  TransformManager::Instance instance = getInstance(entity, transformManager);
  const math::mat4f& transform = transformManager.getTransform(instance);
  return std::make_shared<TMat44Wrapper>(transform);
}
std::shared_ptr<TMat44Wrapper> TransformManagerImpl::getWorldTransform(Entity entity) {
  TransformManager& transformManager = _engine->getTransformManager();
  TransformManager::Instance instance = getInstance(entity, transformManager);
  const math::mat4f& transform = transformManager.getWorldTransform(instance);
  return std::make_shared<TMat44Wrapper>(transform);
}

void TransformManagerImpl::openLocalTransformTransaction() {
  TransformManager& transformManager = _engine->getTransformManager();
  transformManager.openLocalTransformTransaction();
}

void TransformManagerImpl::commitLocalTransformTransaction() {
  TransformManager& transformManager = _engine->getTransformManager();
  transformManager.commitLocalTransformTransaction();
}

void TransformManagerImpl::setTransform(Entity entity, std::shared_ptr<TMat44Wrapper> transform) {
  std::unique_lock lock(_mutex);
  if (!transform) {
    throw std::invalid_argument("Transform is null");
  }

  TransformManager& transformManager = _engine->getTransformManager();
  const math::mat4f& mat = transform->getMat();
  TransformManager::Instance instance = getInstance(entity, transformManager);
  transformManager.setTransform(instance, mat);
}

std::shared_ptr<TMat44Wrapper> TransformManagerImpl::createIdentityMatrix() {
  return std::make_shared<TMat44Wrapper>(math::mat4f::scaling(1));
}

/**
 * Internal method that will help updating the transform of an entity.
 * @param transform The transform matrix to apply
 * @param entity The entity to apply the transform to
 * @param multiplyCurrent If true, the current transform will be multiplied with the new transform, otherwise it will be replaced
 */
void TransformManagerImpl::updateTransform(math::mat4 transform, Entity entity, bool multiplyCurrent) {
  std::unique_lock lock(_mutex);

  TransformManager& transformManager = _engine->getTransformManager();
  TransformManager::Instance instance = getInstance(entity, transformManager);
  auto currentTransform = transformManager.getTransform(instance);
  auto newTransform = multiplyCurrent ? (transform * currentTransform) : transform;
  transformManager.setTransform(instance, newTransform);
}

void TransformManagerImpl::setEntityPosition(Entity entity, std::vector<double> positionVec, bool multiplyCurrent) {
  math::float3 position = Converter::VecToFloat3(positionVec);
  auto translationMatrix = math::mat4::translation(position);
  updateTransform(translationMatrix, entity, multiplyCurrent);
}

void TransformManagerImpl::setEntityRotation(Entity entity, double angleRadians, std::vector<double> axisVec, bool multiplyCurrent) {
  math::float3 axis = Converter::VecToFloat3(axisVec);
  if (axis.x == 0 && axis.y == 0 && axis.z == 0) {
    throw std::invalid_argument("Axis cannot be zero");
  }

  auto rotationMatrix = math::mat4::rotation(angleRadians, axis);
  updateTransform(rotationMatrix, entity, multiplyCurrent);
}

void TransformManagerImpl::setEntityScale(Entity entity, std::vector<double> scaleVec, bool multiplyCurrent) {
  math::float3 scale = Converter::VecToFloat3(scaleVec);
  auto scaleMatrix = math::mat4::scaling(scale);
  updateTransform(scaleMatrix, entity, multiplyCurrent);
}

void TransformManagerImpl::updateTransformByRigidBody(Entity entity, std::shared_ptr<RigidBodyWrapper> rigidBody) {
  std::unique_lock lock(_mutex);
  if (!rigidBody) {
    throw std::invalid_argument("RigidBody is null");
  }

  // get rotation & position from the rigid body (it's not containing any scale information)
  std::shared_ptr<btRigidBody> collisionObject = rigidBody->getRigidBody();
  btMotionState* motionState = collisionObject->getMotionState();
  btTransform bodyTransform;
  motionState->getWorldTransform(bodyTransform);
  btQuaternion rotation = bodyTransform.getRotation();
  btVector3 position = bodyTransform.getOrigin();

  // Create a filament rotation from the bullet rotation
  math::quatf filamentQuat = math::quatf(rotation.getW(), rotation.getX(), rotation.getY(), rotation.getZ());
  math::mat4f filamentRotation = math::mat4f(filamentQuat);

  // Create a filament position from the bullet position
  math::float3 filamentPosition = math::float3(position.getX(), position.getY(), position.getZ());
  math::mat4f filamentTranslation = math::mat4f::translation(filamentPosition);

  // Get the current transform of the filament entity
  TransformManager& transformManager = _engine->getTransformManager();
  TransformManager::Instance instance = getInstance(entity, transformManager);
  math::mat4f currentTransform = transformManager.getTransform(instance);

  // Get the current scale of the filament entity
  float scaleX = std::sqrt(currentTransform[0][0] * currentTransform[0][0] + currentTransform[0][1] * currentTransform[0][1] +
                           currentTransform[0][2] * currentTransform[0][2]);
  float scaleY = std::sqrt(currentTransform[1][0] * currentTransform[1][0] + currentTransform[1][1] * currentTransform[1][1] +
                           currentTransform[1][2] * currentTransform[1][2]);
  float scaleZ = std::sqrt(currentTransform[2][0] * currentTransform[2][0] + currentTransform[2][1] * currentTransform[2][1] +
                           currentTransform[2][2] * currentTransform[2][2]);
  //  Logger::log("EngineImpl", "scaleX: %f, scaleY: %f, scaleZ: %f", scaleX, scaleY, scaleZ);
  math::vec3<float> scaleVec = {scaleX, scaleY, scaleZ};
  auto filamentScale = math::mat4f::scaling(scaleVec);

  // Create a new transform from the position, rotation and scale
  auto newTransform = filamentTranslation * filamentRotation * filamentScale;

  // Set the new transform
  transformManager.setTransform(instance, newTransform);
}

/**
 * Sets up a root transform on the root to make it fit into a cube of the size of 1 unit.
 */
void TransformManagerImpl::transformToUnitCube(Entity rootEntity,
                                               Aabb aabb) {
  std::unique_lock lock(_mutex);
  TransformManager& transformManager = _engine->getTransformManager();
  math::details::TVec3<float> center = aabb.center();
  math::details::TVec3<float> halfExtent = aabb.extent();
  float maxExtent = max(halfExtent) * 2.0f;
  float scaleFactor = 2.0f / maxExtent;
  math::mat4f transform = math::mat4f::scaling(scaleFactor) * math::mat4f::translation(-center);

  TransformManager::Instance instance = getInstance(rootEntity, transformManager);
  transformManager.setTransform(instance, transform);
}

TransformManager::Instance TransformManagerImpl::getInstance(Entity entity, TransformManager& transformManager) {
  if (!entity) {
    [[unlikely]];
    throw std::invalid_argument("Entity is null");
  }

  TransformManager::Instance instance = transformManager.getInstance(entity);
  if (!instance.isValid()) {
    [[unlikely]];
    throw std::invalid_argument("Entity is not valid / has no transform!");
  }

  return instance;
}

} // namespace margelo
