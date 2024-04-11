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

void margelo::SceneWrapper::addEntity(const std::shared_ptr<EntityWrapper>& entity) {
  std::unique_lock lock(_mutex);

  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  _scene->addEntity(entity->getEntity());
}

void SceneWrapper::removeEntity(const std::shared_ptr<EntityWrapper>& entity) {
  std::unique_lock lock(_mutex);

  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  _scene->remove(entity->getEntity());
}

void SceneWrapper::addAsset(const std::shared_ptr<gltfio::FilamentAsset>& asset) {
  std::unique_lock lock(_mutex);

  if (asset == nullptr) {
    Logger::log("SceneWrapper", "Can't add asset an asset from scene as it was null.");
    return;
  }

  _scene->addEntities(asset->getEntities(), asset->getEntityCount());
}

void SceneWrapper::removeAsset(const std::shared_ptr<gltfio::FilamentAsset>& asset) {
  std::unique_lock lock(_mutex);

  if (asset == nullptr) {
    Logger::log("SceneWrapper", "Can't remove asset an asset from scene as it was null.");
    return;
  }

  Logger::log("SceneWrapper", "Removing an asset from scene");
  auto entities = asset->getEntities();
  auto entityCount = asset->getEntityCount();
  _scene->removeEntities(entities, entityCount);
}

void SceneWrapper::removeAssetEntities(const std::shared_ptr<FilamentAssetWrapper>& asset) {
  if (asset == nullptr) {
    throw std::invalid_argument("Asset is null");
  }

  const std::shared_ptr<gltfio::FilamentAsset>& filamentAsset = asset->getAsset();
  if (filamentAsset == nullptr) {
    throw std::invalid_argument("Filament asset is null");
  }

  removeAsset(filamentAsset);
}

void SceneWrapper::addAssetEntities(const std::shared_ptr<FilamentAssetWrapper>& asset) {
  if (asset == nullptr) {
    throw std::invalid_argument("Asset is null");
  }

  const std::shared_ptr<gltfio::FilamentAsset>& filamentAsset = asset->getAsset();
  if (filamentAsset == nullptr) {
    throw std::invalid_argument("Filament asset is null");
  }

  addAsset(filamentAsset);
}

int SceneWrapper::getEntityCount() {
  return _scene->getEntityCount();
}

} // namespace margelo
