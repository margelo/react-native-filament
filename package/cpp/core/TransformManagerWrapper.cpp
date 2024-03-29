//
// Created by Hanno Gödecke on 15.03.24.
//

#include "TransformManagerWrapper.h"
#include <filament/TransformManager.h>
#include <math/mat4.h>
#include <utils/EntityInstance.h>

namespace margelo {
void TransformManagerWrapper::loadHybridMethods() {
  registerHybridMethod("getTransform", &TransformManagerWrapper::getTransform, this);
  registerHybridMethod("getWorldTransform", &TransformManagerWrapper::getWorldTransform, this);
  registerHybridMethod("openLocalTransformTransaction", &TransformManagerWrapper::openLocalTransformTransaction, this);
  registerHybridMethod("commitLocalTransformTransaction", &TransformManagerWrapper::commitLocalTransformTransaction, this);
  registerHybridMethod("setTransform", &TransformManagerWrapper::setTransform, this);
}

std::shared_ptr<TMat44Wrapper> TransformManagerWrapper::getTransform(std::shared_ptr<EntityWrapper> entity) {
  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  EntityInstance<filament::TransformManager> entityInstance = _transformManager.getInstance(entity->getEntity());
  const math::mat4f& transform = _transformManager.getTransform(entityInstance);
  return std::make_shared<TMat44Wrapper>(transform);
}

std::shared_ptr<TMat44Wrapper> TransformManagerWrapper::getWorldTransform(std::shared_ptr<EntityWrapper> entity) {
  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  EntityInstance<filament::TransformManager> entityInstance = _transformManager.getInstance(entity->getEntity());
  const math::mat4f& transform = _transformManager.getWorldTransform(entityInstance);
  return std::make_shared<TMat44Wrapper>(transform);
}

void TransformManagerWrapper::openLocalTransformTransaction() {
  _transformManager.openLocalTransformTransaction();
}

void TransformManagerWrapper::commitLocalTransformTransaction() {
  _transformManager.commitLocalTransformTransaction();
}

void TransformManagerWrapper::setTransform(std::shared_ptr<EntityWrapper> entityWrapper, std::shared_ptr<TMat44Wrapper> transform) {
  if (!entityWrapper) {
    throw std::invalid_argument("Entity is null");
  }

  if (!transform) {
    throw std::invalid_argument("Transform is null");
  }

  Entity entity = entityWrapper->getEntity();
  const math::mat4f& mat = transform->getMat();
  EntityInstance<filament::TransformManager> entityInstance = _transformManager.getInstance(entity);
  _transformManager.setTransform(entityInstance, mat);
}

} // namespace margelo