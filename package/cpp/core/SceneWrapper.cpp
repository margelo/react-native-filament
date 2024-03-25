#include "SceneWrapper.h"
#include <filament/TransformManager.h>
#include <utils/Entity.h>

namespace margelo {

void margelo::SceneWrapper::loadHybridMethods() {
  registerHybridMethod("addEntity", &SceneWrapper::addEntity, this);
  registerHybridMethod("addAssetEntities", &SceneWrapper::addAssetEntities, this);
  registerHybridMethod("removeAssetEntities", &SceneWrapper::removeAssetEntities, this);
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

void SceneWrapper::removeAssetEntities(std::shared_ptr<FilamentAssetWrapper> asset) {
  if (asset == nullptr) {
    throw new std::invalid_argument("Asset is null");
  }

  std::shared_ptr<gltfio::FilamentAsset> filamentAsset = asset->getAsset();
  if (filamentAsset == nullptr) {
    throw new std::invalid_argument("Filament asset is null");
  }

  removeAsset(filamentAsset);
}

void SceneWrapper::addAssetEntities(std::shared_ptr<FilamentAssetWrapper> asset) {
  if (asset == nullptr) {
    throw new std::invalid_argument("Asset is null");
  }

  std::shared_ptr<gltfio::FilamentAsset> filamentAsset = asset->getAsset();
  if (filamentAsset == nullptr) {
    throw new std::invalid_argument("Filament asset is null");
  }

  addAsset(filamentAsset);
}

} // namespace margelo
