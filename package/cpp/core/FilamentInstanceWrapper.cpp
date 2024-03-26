//
// Created by Hanno Gödecke on 26.03.24.
//

#include "FilamentInstanceWrapper.h"

namespace margelo {

void FilamentInstanceWrapper::loadHybridMethods() {
  registerHybridMethod("getEntities", &FilamentInstanceWrapper::getEntities, this);
  registerHybridMethod("getRoot", &FilamentInstanceWrapper::getRoot, this);
  registerHybridMethod("getAnimator", &FilamentInstanceWrapper::getAnimator, this);
}

std::vector<std::shared_ptr<EntityWrapper>> FilamentInstanceWrapper::getEntities() {
  std::vector<std::shared_ptr<EntityWrapper>> entities;
  const Entity* entityArray = _instance->getEntities();
  size_t entityCount = _instance->getEntityCount();
  for (int i = 0; i < entityCount; i++) {
    entities.push_back(std::make_shared<EntityWrapper>(entityArray[i]));
  }
  return entities;
}

std::shared_ptr<EntityWrapper> FilamentInstanceWrapper::getRoot() {
  Entity rootEntity = _instance->getRoot();
  return std::make_shared<EntityWrapper>(rootEntity);
}

std::shared_ptr<AnimatorWrapper> FilamentInstanceWrapper::getAnimator() {
  return std::make_shared<AnimatorWrapper>(_instance);
}

} // namespace margelo
