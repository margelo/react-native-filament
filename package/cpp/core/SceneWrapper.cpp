#include "SceneWrapper.h"

void margelo::SceneWrapper::loadHybridMethods() {
  registerHybridMethod("addEntity", &SceneWrapper::addEntity, this);
}

void margelo::SceneWrapper::addEntity(std::shared_ptr<EntityWrapper> entity) {
  _scene->addEntity(entity->getEntity());
}
