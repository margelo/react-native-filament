#include "FilamentAssetWrapper.h"
#include "FilamentInstanceWrapper.h"
#include "SceneWrapper.h"

#include <utils/Entity.h>
#include <utils/EntityInstance.h>

namespace margelo {

using namespace utils;

void FilamentAssetWrapper::loadHybridMethods() {
  registerHybridMethod("getRoot", &FilamentAssetWrapper::getRoot, this);
  registerHybridMethod("releaseSourceData", &FilamentAssetWrapper::releaseSourceData, this);
  registerHybridMethod("getAnimator", &FilamentAssetWrapper::getAnimator, this);
  registerHybridMethod("createAnimatorWithAnimationsFrom", &FilamentAssetWrapper::createAnimatorWithAnimationsFrom, this);
  registerHybridGetter("entityCount", &FilamentAssetWrapper::getEntityCount, this);
  registerHybridMethod("getEntities", &FilamentAssetWrapper::getEntities, this);
  registerHybridGetter("renderableEntityCount", &FilamentAssetWrapper::getRenderableEntityCount, this);
  registerHybridMethod("getRenderableEntities", &FilamentAssetWrapper::getRenderableEntities, this);
  registerHybridGetter("boundingBox", &FilamentAssetWrapper::getBoundingBox, this);
  registerHybridMethod("getFirstEntityByName", &FilamentAssetWrapper::getFirstEntityByName, this);
  registerHybridMethod("getInstance", &FilamentAssetWrapper::getInstance, this);
  registerHybridMethod("getAssetInstances", &FilamentAssetWrapper::getAssetInstances, this);
  registerHybridMethod("release", &FilamentAssetWrapper::release, this);
}

/**
 * Sets up a root transform on the current model to make it fit into a unit cube.
 */
void FilamentAssetWrapper::transformToUnitCube(TransformManager& transformManager) {
  std::unique_lock lock(_mutex);
  Aabb aabb = _asset->getBoundingBox();
  math::details::TVec3<float> center = aabb.center();
  math::details::TVec3<float> halfExtent = aabb.extent();
  float maxExtent = max(halfExtent) * 2.0f;
  float scaleFactor = 2.0f / maxExtent;
  math::mat4f transform = math::mat4f::scaling(scaleFactor) * math::mat4f::translation(-center);
  EntityInstance<TransformManager> transformInstance = transformManager.getInstance(_asset->getRoot());
  transformManager.setTransform(transformInstance, transform);
}

std::shared_ptr<EntityWrapper> FilamentAssetWrapper::getRoot() {
  Entity rootEntity = _asset->getRoot();
  return std::make_shared<EntityWrapper>(rootEntity);
}

void FilamentAssetWrapper::releaseSourceData() {
  std::unique_lock lock(_mutex);
  _asset->releaseSourceData();
}

std::shared_ptr<AnimatorWrapper> FilamentAssetWrapper::getAnimator() {
  return std::make_shared<AnimatorWrapper>(_asset);
}

std::shared_ptr<AnimatorWrapper> FilamentAssetWrapper::createAnimatorWithAnimationsFrom(std::shared_ptr<FilamentAssetWrapper> otherAsset) {
#ifdef HAS_FILAMENT_ANIMATOR_PATCH
  // TODO(copy-animations): We currently copy animations from an asset onto another instance (different model than the original asset), we
  // should replace this with once we found a good solution discussed here: https://github.com/google/filament/issues/7622
  Animator* animator = new gltfio::Animator(otherAsset->_asset.get(), _asset->getInstance());
  return std::make_shared<AnimatorWrapper>(_asset, animator);
#else
  return getAnimator();
#endif
}

std::vector<std::shared_ptr<EntityWrapper>> FilamentAssetWrapper::getEntities() {
  std::vector<std::shared_ptr<EntityWrapper>> entities;
  const Entity* entityArray = _asset->getEntities();
  for (int i = 0; i < _asset->getEntityCount(); i++) {
    entities.push_back(std::make_shared<EntityWrapper>(entityArray[i]));
  }
  return entities;
}

std::vector<std::shared_ptr<EntityWrapper>> FilamentAssetWrapper::getRenderableEntities() {
  std::vector<std::shared_ptr<EntityWrapper>> entities;
  const Entity* entityArray = _asset->getRenderableEntities();
  for (int i = 0; i < _asset->getRenderableEntityCount(); i++) {
    entities.push_back(std::make_shared<EntityWrapper>(entityArray[i]));
  }
  return entities;
}

std::optional<std::shared_ptr<EntityWrapper>> FilamentAssetWrapper::getFirstEntityByName(const std::string& name) {
  Entity entity = _asset->getFirstEntityByName(name.c_str());
  if (entity.isNull()) {
    Logger::log("FilamentAssetWrapper", "Entity with name %s not found!", name.c_str());
    return std::nullopt;
  }

  return std::make_shared<EntityWrapper>(entity);
}

std::shared_ptr<FilamentInstanceWrapper> FilamentAssetWrapper::getInstance() {
  FilamentInstance* instance = _asset->getInstance();
  return std::make_shared<FilamentInstanceWrapper>(instance);
}

std::vector<std::shared_ptr<FilamentInstanceWrapper>> FilamentAssetWrapper::getAssetInstances() {
  std::vector<std::shared_ptr<FilamentInstanceWrapper>> instances;
  FilamentInstance** instanceArray = _asset->getAssetInstances();
  size_t instanceCount = _asset->getAssetInstanceCount();
  for (int i = 0; i < instanceCount; i++) {
    instances.push_back(std::make_shared<FilamentInstanceWrapper>(instanceArray[i]));
  }
  return instances;
}

void FilamentAssetWrapper::release() {
  _scene->removeAsset(_asset);
  std::unique_lock lock(_mutex); // removeAsset already has its own lock
  _asset.reset();
  _scene.reset();
}

} // namespace margelo
