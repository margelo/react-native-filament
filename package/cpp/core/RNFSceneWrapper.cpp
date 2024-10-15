#include "RNFSceneWrapper.h"
#include <filament/TransformManager.h>
#include <utils/Entity.h>

namespace margelo {

void margelo::SceneWrapper::loadHybridMethods() {
  PointerHolder::loadHybridMethods();
  registerHybrids(this, [](nitro::Prototype& proto) {
    proto.registerHybridMethod("addEntity", &SceneWrapper::addEntity);
    proto.registerHybridMethod("addEntities", &SceneWrapper::addEntities);
    proto.registerHybridMethod("removeEntity", &SceneWrapper::removeEntity);
    proto.registerHybridMethod("removeEntities", &SceneWrapper::removeEntities);
    proto.registerHybridMethod("addAssetEntities", &SceneWrapper::addAssetEntities);
    proto.registerHybridMethod("removeAssetEntities", &SceneWrapper::removeAssetEntities);
    proto.registerHybridGetter("entityCount", &SceneWrapper::getEntityCount);
  });
}

void margelo::SceneWrapper::addEntity(std::shared_ptr<EntityWrapper> entity) {
  std::unique_lock lock(_mutex);

  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  pointee()->addEntity(entity->getEntity());
}

void SceneWrapper::addEntities(std::vector<std::shared_ptr<EntityWrapper>> entities) {
  std::unique_lock lock(_mutex);

  size_t count = entities.size();
  std::vector<Entity> entityArray = entityWrapperVectorToEntityVector(entities, count);
  const Entity* entityArrayPtr = entityArray.data();
  pointee()->addEntities(entityArrayPtr, count);
}

void SceneWrapper::removeEntity(std::shared_ptr<EntityWrapper> entity) {
  std::unique_lock lock(_mutex);

  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  pointee()->remove(entity->getEntity());
}

void SceneWrapper::removeEntities(std::vector<std::shared_ptr<EntityWrapper>> entities) {
  std::unique_lock lock(_mutex);

  size_t count = entities.size();
  std::vector<Entity> entityArray = entityWrapperVectorToEntityVector(entities, count);
  const Entity* entityArrayPtr = entityArray.data();
  pointee()->removeEntities(entityArrayPtr, count);
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

std::vector<Entity> SceneWrapper::entityWrapperVectorToEntityVector(std::vector<std::shared_ptr<EntityWrapper>> entities, size_t count) {
  if (entities.empty()) {
    throw std::invalid_argument("Entities are empty");
  }

  std::vector<Entity> entityArray;
  entityArray.reserve(count);
  for (const auto& entityWrapper : entities) {
    Entity entity = entityWrapper->getEntity();
    entityArray.push_back(entity);
  }

  return entityArray;
}

} // namespace margelo
