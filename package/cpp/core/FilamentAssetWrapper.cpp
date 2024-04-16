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
  registerHybridMethod("createAnimator", &FilamentAssetWrapper::createAnimator, this);
  registerHybridMethod("createAnimatorWithAnimationsFrom", &FilamentAssetWrapper::createAnimatorWithAnimationsFrom, this);
  registerHybridGetter("entityCount", &FilamentAssetWrapper::getEntityCount, this);
  registerHybridMethod("getEntities", &FilamentAssetWrapper::getEntities, this);
  registerHybridGetter("renderableEntityCount", &FilamentAssetWrapper::getRenderableEntityCount, this);
  registerHybridMethod("getRenderableEntities", &FilamentAssetWrapper::getRenderableEntities, this);
  registerHybridGetter("boundingBox", &FilamentAssetWrapper::getBoundingBox, this);
  registerHybridMethod("getFirstEntityByName", &FilamentAssetWrapper::getFirstEntityByName, this);
  registerHybridMethod("getInstance", &FilamentAssetWrapper::getInstance, this);
  registerHybridMethod("getAssetInstances", &FilamentAssetWrapper::getAssetInstances, this);
}

/**
 * Sets up a root transform on the current model to make it fit into a unit cube.
 */
void FilamentAssetWrapper::transformToUnitCube(TransformManager& transformManager) {
  std::unique_lock lock(_mutex);
  Aabb aabb = pointee()->getBoundingBox();
  math::details::TVec3<float> center = aabb.center();
  math::details::TVec3<float> halfExtent = aabb.extent();
  float maxExtent = max(halfExtent) * 2.0f;
  float scaleFactor = 2.0f / maxExtent;
  math::mat4f transform = math::mat4f::scaling(scaleFactor) * math::mat4f::translation(-center);
  EntityInstance<TransformManager> transformInstance = transformManager.getInstance(pointee()->getRoot());
  transformManager.setTransform(transformInstance, transform);
}

std::shared_ptr<EntityWrapper> FilamentAssetWrapper::getRoot() {
  Entity rootEntity = pointee()->getRoot();
  return std::make_shared<EntityWrapper>(rootEntity);
}

void FilamentAssetWrapper::releaseSourceData() {
  std::unique_lock lock(_mutex);
  pointee()->releaseSourceData();
}

std::shared_ptr<AnimatorWrapper> FilamentAssetWrapper::createAnimator() {
  FilamentInstance* instance = pointee()->getInstance();
  Animator* animator = instance->getAnimator();
  return std::make_shared<AnimatorWrapper>(animator);
}

std::shared_ptr<CopiedAnimatorWrapper>
FilamentAssetWrapper::createAnimatorWithAnimationsFrom(std::shared_ptr<FilamentAssetWrapper> otherAsset) {
#ifdef HAS_FILAMENT_ANIMATOR_PATCH
  // TODO(copy-animations): We currently copy animations from an asset onto another instance (different model than the original asset), we
  // should replace this with once we found a good solution discussed here: https://github.com/google/filament/issues/7622
  std::shared_ptr<Animator> animator = std::make_shared<gltfio::Animator>(otherAsset->pointee().get(), pointee()->getInstance());
  return std::make_shared<CopiedAnimatorWrapper>(animator);
#else
  return getAnimator();
#endif
}

std::vector<std::shared_ptr<EntityWrapper>> FilamentAssetWrapper::getEntities() {
  std::vector<std::shared_ptr<EntityWrapper>> entities;
  const Entity* entityArray = pointee()->getEntities();
  for (int i = 0; i < pointee()->getEntityCount(); i++) {
    entities.push_back(std::make_shared<EntityWrapper>(entityArray[i]));
  }
  return entities;
}

std::vector<std::shared_ptr<EntityWrapper>> FilamentAssetWrapper::getRenderableEntities() {
  std::vector<std::shared_ptr<EntityWrapper>> entities;
  const Entity* entityArray = pointee()->getRenderableEntities();
  for (int i = 0; i < pointee()->getRenderableEntityCount(); i++) {
    entities.push_back(std::make_shared<EntityWrapper>(entityArray[i]));
  }
  return entities;
}

std::optional<std::shared_ptr<EntityWrapper>> FilamentAssetWrapper::getFirstEntityByName(const std::string& name) {
  Entity entity = pointee()->getFirstEntityByName(name.c_str());
  if (entity.isNull()) {
    Logger::log("FilamentAssetWrapper", "Entity with name %s not found!", name.c_str());
    return std::nullopt;
  }

  return std::make_shared<EntityWrapper>(entity);
}

std::shared_ptr<FilamentInstanceWrapper> FilamentAssetWrapper::getInstance() {
  FilamentInstance* instance = pointee()->getInstance();
  return std::make_shared<FilamentInstanceWrapper>(instance);
}

std::vector<std::shared_ptr<FilamentInstanceWrapper>> FilamentAssetWrapper::getAssetInstances() {
  std::vector<std::shared_ptr<FilamentInstanceWrapper>> instances;
  FilamentInstance** instanceArray = pointee()->getAssetInstances();
  size_t instanceCount = pointee()->getAssetInstanceCount();
  for (int i = 0; i < instanceCount; i++) {
    instances.push_back(std::make_shared<FilamentInstanceWrapper>(instanceArray[i]));
  }
  return instances;
}

} // namespace margelo
