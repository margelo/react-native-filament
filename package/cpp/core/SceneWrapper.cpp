#include "SceneWrapper.h"
#include <filament/TransformManager.h>

namespace margelo {

SceneWrapper::~SceneWrapper() {
  // Remove all assets from the scene and then destroy them
  Logger::log("SceneWrapper", "Removing all assets from scene and destroying them");
  for (auto& asset : _assets) {
    removeAsset(asset);
    _assetLoader->destroyAsset(asset.get());
  }
}

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
  if (asset == nullptr) {
    Logger::log("SceneWrapper", "Can't add asset an asset from scene as it was null.");
    return;
  }

  _assets.push_back(asset);
  _scene->addEntities(asset->getEntities(), asset->getEntityCount());
}

void SceneWrapper::removeAsset(std::shared_ptr<gltfio::FilamentAsset> asset) {
  if (asset == nullptr) {
    Logger::log("SceneWrapper", "Can't remove asset an asset from scene as it was null.");
    return;
  }

  Logger::log("SceneWrapper", "Removing an asset from scene");
  auto newEnd = std::remove(_assets.begin(), _assets.end(), asset);
  _assets.erase(newEnd, _assets.end());
  auto entities = asset->getEntities();
  auto entityCount = asset->getEntityCount();
  _scene->removeEntities(entities, entityCount);
}

} // namespace margelo
