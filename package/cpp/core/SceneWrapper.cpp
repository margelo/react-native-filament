#include "SceneWrapper.h"
#include <filament/TransformManager.h>

namespace margelo {

void margelo::SceneWrapper::loadHybridMethods() {
  registerHybridMethod("addEntity", &SceneWrapper::addEntity, this);
}

void margelo::SceneWrapper::addEntity(std::shared_ptr<EntityWrapper> entity) {
  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  _scene->addEntity(entity->getEntity());
}

void SceneWrapper::addAsset(std::shared_ptr<gltfio::FilamentAsset> asset) {
  _assets.push_back(asset);
  _scene->addEntities(asset->getEntities(), asset->getEntityCount());
}

} // namespace margelo
