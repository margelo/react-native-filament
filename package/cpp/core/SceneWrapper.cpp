#include "SceneWrapper.h"

void margelo::SceneWrapper::loadHybridMethods() {
  registerHybridMethod("addEntity", &SceneWrapper::addEntity, this);
}

void margelo::SceneWrapper::addEntity(std::shared_ptr<EntityWrapper> entity) {
  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  _scene->addEntity(entity->getEntity());
}
