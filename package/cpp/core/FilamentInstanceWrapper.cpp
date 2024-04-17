//
// Created by Hanno Gödecke on 26.03.24.
//

#include "FilamentInstanceWrapper.h"

namespace margelo {

void FilamentInstanceWrapper::loadHybridMethods() {
  registerHybridMethod("getEntities", &FilamentInstanceWrapper::getEntities, this);
  registerHybridMethod("getRoot", &FilamentInstanceWrapper::getRoot, this);
  registerHybridMethod("createAnimator", &FilamentInstanceWrapper::createAnimator, this);
  registerHybridMethod("getBoundingBox", &FilamentInstanceWrapper::getBoundingBox, this);
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

std::shared_ptr<AnimatorWrapper> FilamentInstanceWrapper::createAnimator() {
  Animator* animator = _instance->getAnimator();
  return std::make_shared<AnimatorWrapper>(animator);
}
std::shared_ptr<AABBWrapper> FilamentInstanceWrapper::getBoundingBox() {
  auto box = _instance->getBoundingBox();
  return std::make_shared<AABBWrapper>(box);
}

} // namespace margelo
