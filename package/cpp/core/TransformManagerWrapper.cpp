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
}

std::shared_ptr<TMat44Wrapper> TransformManagerWrapper::getTransform(std::shared_ptr<EntityWrapper> entity) {
  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  EntityInstance<filament::TransformManager> entityInstance = _transformManager.getInstance(entity->getEntity());
  const math::mat4f& transform = _transformManager.getTransform(entityInstance);
  return std::make_shared<TMat44Wrapper>(transform);
}
} // namespace margelo