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
  registerHybridMethod("release", &SceneWrapper::release, this);
}

void margelo::SceneWrapper::addEntity(std::shared_ptr<EntityWrapper> entity) {
  std::unique_lock lock(_mutex);

  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  _scene->addEntity(entity->getEntity());
}

void SceneWrapper::removeEntity(std::shared_ptr<EntityWrapper> entity) {
  std::unique_lock lock(_mutex);

  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  if (_scene == nullptr) {
    Logger::log("SceneWrapper", "Can't remove entity from scene as it was null. This can happen when release() was already called on the "
                                "scene.\nNote that the scene removes all entities when it is released.");
    return;
  }

  _scene->remove(entity->getEntity());
}

void SceneWrapper::addAsset(std::shared_ptr<gltfio::FilamentAsset> asset) {
  std::unique_lock lock(_mutex);

  if (asset == nullptr) {
    Logger::log("SceneWrapper", "Can't add asset an asset from scene as it was null.");
    return;
  }

  _scene->addEntities(asset->getEntities(), asset->getEntityCount());
}

void SceneWrapper::removeAsset(std::shared_ptr<gltfio::FilamentAsset> asset) {
  std::unique_lock lock(_mutex);

  if (asset == nullptr) {
    Logger::log("SceneWrapper", "Can't remove an asset from scene as it was null.");
    return;
  }

  if (_scene == nullptr) {
    Logger::log("SceneWrapper", "Can't remove entity from scene as it was null. This can happen when release() was already called on the "
                                "scene.\nNote that the scene removes all entities when it is released.");
    return;
  }

  Logger::log("SceneWrapper", "Removing an asset from scene");
  auto entities = asset->getEntities();
  auto entityCount = asset->getEntityCount();
  _scene->removeEntities(entities, entityCount);
}

void SceneWrapper::addAssetEntities(std::shared_ptr<FilamentAssetWrapper> asset) {
  if (asset == nullptr) {
    throw std::invalid_argument("Asset is null");
  }

  std::shared_ptr<gltfio::FilamentAsset> filamentAsset = asset->getAsset();
  addAsset(filamentAsset);
}

void SceneWrapper::removeAssetEntities(std::shared_ptr<FilamentAssetWrapper> asset) {
  if (asset == nullptr) {
    throw std::invalid_argument("Asset is null");
  }

  if (_scene == nullptr) {
    Logger::log("SceneWrapper", "Can't remove entity from scene as it was null. This can happen when release() was already called on the "
                                "scene.\nNote that the scene removes all entities when it is released.");
    return;
  }

  std::shared_ptr<gltfio::FilamentAsset> filamentAsset = asset->getAsset();
  removeAsset(filamentAsset);
}

int SceneWrapper::getEntityCount() {
  return _scene->getEntityCount();
}

void SceneWrapper::release() {
  std::unique_lock lock(_mutex);
  Logger::log("SceneWrapper", "Releasing scene…");
  _scene = nullptr;
}

} // namespace margelo
