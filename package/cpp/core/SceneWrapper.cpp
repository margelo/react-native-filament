#include "SceneWrapper.h"
#include <filament/TransformManager.h>
#include <utils/Entity.h>

namespace margelo {

void margelo::SceneWrapper::loadHybridMethods() {
  registerHybridMethod("addEntity", &SceneWrapper::addEntity, this);
  registerHybridMethod("removeEntity", &SceneWrapper::removeEntity, this);
  registerHybridMethod("addAssetEntities", &SceneWrapper::addAssetEntities, this);
  registerHybridMethod("removeAssetEntities", &SceneWrapper::removeAssetEntities, this);
  registerHybridGetter("entityCount", &SceneWrapper::getEntityCount, this);
}

void margelo::SceneWrapper::addEntity(std::shared_ptr<EntityWrapper> entity) {
  std::unique_lock lock(_mutex);

  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  pointee()->addEntity(entity->getEntity());
}

void SceneWrapper::removeEntity(std::shared_ptr<EntityWrapper> entity) {
  std::unique_lock lock(_mutex);

  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  pointee()->remove(entity->getEntity());
}

void SceneWrapper::addAsset(std::shared_ptr<gltfio::FilamentAsset> asset) {
  std::unique_lock lock(_mutex);

  if (asset == nullptr) {
    Logger::log("SceneWrapper", "Can't add asset an asset from scene as it was null.");
    return;
  }

  pointee()->addEntities(asset->getEntities(), asset->getEntityCount());
}

void SceneWrapper::removeAsset(std::shared_ptr<gltfio::FilamentAsset> asset) {
  std::unique_lock lock(_mutex);

  if (asset == nullptr) {
    Logger::log("SceneWrapper", "Can't remove an asset from scene as it was null.");
    return;
  }

  Logger::log("SceneWrapper", "Removing an asset from scene");
  auto entities = asset->getEntities();
  auto entityCount = asset->getEntityCount();
  pointee()->removeEntities(entities, entityCount);
}

void SceneWrapper::removeAssetEntities(std::shared_ptr<FilamentAssetWrapper> asset) {
  if (asset == nullptr) {
    throw std::invalid_argument("Asset is null");
  }

  std::shared_ptr<gltfio::FilamentAsset> filamentAsset = asset->getAsset();
  if (filamentAsset == nullptr) {
    throw std::invalid_argument("Filament asset is null");
  }

  removeAsset(filamentAsset);
}

void SceneWrapper::addAssetEntities(std::shared_ptr<FilamentAssetWrapper> asset) {
  if (asset == nullptr) {
    throw std::invalid_argument("Asset is null");
  }

  std::shared_ptr<gltfio::FilamentAsset> filamentAsset = asset->getAsset();
  if (filamentAsset == nullptr) {
    throw std::invalid_argument("Filament asset is null");
  }

  addAsset(filamentAsset);
}

int SceneWrapper::getEntityCount() {
  return pointee()->getEntityCount();
}

} // namespace margelo
