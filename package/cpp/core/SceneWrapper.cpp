#include "SceneWrapper.h"

margelo::SceneWrapper::~SceneWrapper() {
  // TODO: Engine#destroyScene(Scene)
  _scene = nullptr;
}

void margelo::SceneWrapper::loadHybridMethods() {
  registerHybridMethod("addEntity", &SceneWrapper::addEntity, this);
}

void margelo::SceneWrapper::addEntity(std::shared_ptr<EntityWrapper> entity) {
  _scene->addEntity(entity->entity);
}
