//
// Created by Hanno Gödecke on 26.03.24.
//

#include "RNFFilamentInstanceWrapper.h"
#include "RNFAnimatorWrapper.h"

#include <map>

namespace margelo {

void FilamentInstanceWrapper::loadHybridMethods() {
  registerHybridGetter("entityCount", &FilamentInstanceWrapper::getEntityCount, this);
  registerHybridMethod("getEntities", &FilamentInstanceWrapper::getEntities, this);
  registerHybridMethod("getRoot", &FilamentInstanceWrapper::getRoot, this);
  registerHybridMethod("createAnimator", &FilamentInstanceWrapper::createAnimator, this);
  registerHybridMethod("getBoundingBox", &FilamentInstanceWrapper::getBoundingBox, this);
}

int FilamentInstanceWrapper::getEntityCount() {
    size_t count = _instance->getEntityCount();
    return static_cast<int>(count);
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

std::shared_ptr<AnimatorWrapper>
FilamentInstanceWrapper::createAnimator(std::shared_ptr<NameComponentManagerWrapper> nameComponentManager) {
  Animator* animator = _instance->getAnimator();
  std::shared_ptr<NameComponentManager> manager = nameComponentManager->getManager();
  return std::make_shared<AnimatorWrapper>(animator, _instance, manager);
}
std::shared_ptr<AABBWrapper> FilamentInstanceWrapper::getBoundingBox() {
  auto box = _instance->getBoundingBox();
  return std::make_shared<AABBWrapper>(box);
}

} // namespace margelo
