//
// Created by Hanno Gödecke on 29.02.24.
//

#include "RNFAnimatorWrapper.h"
#include <filament/Engine.h>
#include <filament/TransformManager.h>
#include <utils/NameComponentManager.h>

namespace margelo {
void AnimatorWrapper::loadHybridMethods() {
  HybridObject::loadHybridMethods();
  registerHybrids(this, [](nitro::Prototype& proto) {
    proto.registerHybridMethod("applyAnimation", &AnimatorWrapper::applyAnimation);
    proto.registerHybridMethod("updateBoneMatrices", &AnimatorWrapper::updateBoneMatrices);
    proto.registerHybridMethod("applyCrossFade", &AnimatorWrapper::applyCrossFade);
    proto.registerHybridMethod("resetBoneMatrices", &AnimatorWrapper::resetBoneMatrices);
    proto.registerHybridMethod("getAnimationCount", &AnimatorWrapper::getAnimationCount);
    proto.registerHybridMethod("getAnimationDuration", &AnimatorWrapper::getAnimationDuration);
    proto.registerHybridMethod("getAnimationName", &AnimatorWrapper::getAnimationName);
    proto.registerHybridMethod("addToSyncList", &AnimatorWrapper::addToSyncList);
    proto.registerHybridMethod("removeFromSyncList", &AnimatorWrapper::removeFromSyncList);
  });
}

inline void assertAnimationIndexSmallerThan(int animationIndex, int max) {
  if (animationIndex >= max || animationIndex < 0) {
    [[unlikely]];
    throw std::invalid_argument("Animation index out of range! Expected <" + std::to_string(max) + ", received " +
                                std::to_string(animationIndex));
  }
}

inline void assertAnimatorNotNull(Animator* animator) {
  if (animator == nullptr) {
    [[unlikely]];
    throw std::runtime_error("Failed to call animator method, as the internal animator was null. You probably tried to access the animator "
                             "after calling .release()");
  }
}

inline void assertInstanceNotNull(FilamentInstance* instance) {
  if (instance == nullptr) {
    [[unlikely]];
    throw std::runtime_error("Failed to call animator method, as the internal instance was null. You probably tried to access the animator "
                             "after calling .release()");
  }
}

void AnimatorWrapper::applyAnimation(int animationIndex, double time) {
  std::unique_lock lock(_mutex);
  assertAnimatorNotNull(_animator);
  assertAnimationIndexSmallerThan(animationIndex, _animator->getAnimationCount());
  _animator->applyAnimation(animationIndex, time);
}

void AnimatorWrapper::updateBoneMatrices() {
  std::unique_lock lock(_mutex);
  assertAnimatorNotNull(_animator);
  _animator->updateBoneMatrices();
  syncInstances();
}

void AnimatorWrapper::applyCrossFade(int previousAnimationIndex, double previousAnimationTime, double alpha) {
  std::unique_lock lock(_mutex);
  assertAnimatorNotNull(_animator);
  assertAnimationIndexSmallerThan(previousAnimationIndex, _animator->getAnimationCount());
  _animator->applyCrossFade(previousAnimationIndex, previousAnimationTime, alpha);
}

void AnimatorWrapper::resetBoneMatrices() {
  std::unique_lock lock(_mutex);
  assertAnimatorNotNull(_animator);
  _animator->resetBoneMatrices();
  syncInstances();
}

int AnimatorWrapper::getAnimationCount() {
  std::unique_lock lock(_mutex);
  assertAnimatorNotNull(_animator);
  return _animator->getAnimationCount();
}

double AnimatorWrapper::getAnimationDuration(int animationIndex) {
  std::unique_lock lock(_mutex);
  assertAnimatorNotNull(_animator);
  return _animator->getAnimationDuration(animationIndex);
}

std::string AnimatorWrapper::getAnimationName(int animationIndex) {
  std::unique_lock lock(_mutex);
  assertAnimatorNotNull(_animator);
  return _animator->getAnimationName(animationIndex);
}

int AnimatorWrapper::addToSyncList(std::shared_ptr<FilamentInstanceWrapper> instanceWrapper) {
  std::unique_lock lock(_mutex);

  if (instanceWrapper == nullptr) {
    [[unlikely]];
    throw std::invalid_argument("Instance must not be null");
  }

  int id = _syncId++;
  FilamentInstance* instance = instanceWrapper->getInstance();
  std::map<std::string, Entity> entityMap = createEntityNameMap(instance);
  _syncMap.insert({id, instance});
  _instanceEntityMap.insert({id, entityMap});

  Logger::log(TAG, "Added instance with id %d to sync list", id);
  return id;
}

void AnimatorWrapper::removeFromSyncList(int instanceId) {
  std::unique_lock lock(_mutex);

  if (_syncMap.find(instanceId) == _syncMap.end()) {
    [[unlikely]];
    throw std::invalid_argument("Instance with id " + std::to_string(instanceId) + " not found in sync list");
  }

  Logger::log(TAG, "Removed instance with id %d from sync list", instanceId);
  _syncMap.erase(instanceId);
  _instanceEntityMap.erase(instanceId);
}

EntityNameMap AnimatorWrapper::createEntityNameMap(FilamentInstance* instance) {
  assertInstanceNotNull(instance);

  size_t masterEntitiesCount = instance->getEntityCount();
  const Entity* masterEntities = instance->getEntities();
  std::map<std::string, Entity> entityMap;
  for (size_t entityIndex = 0; entityIndex < masterEntitiesCount; entityIndex++) {
    const Entity masterEntity = masterEntities[entityIndex];
    NameComponentManager::Instance masterNameInstance = _nameComponentManager->getInstance(masterEntity);
    if (!masterNameInstance.isValid()) {
      continue;
    }
    auto masterInstanceName = _nameComponentManager->getName(masterNameInstance);
    if (masterInstanceName == nullptr) {
      continue;
    }
    entityMap[masterInstanceName] = masterEntity;
  }

  return entityMap;
}

void AnimatorWrapper::applyAnimationTo(EntityNameMap entitiesNameMap) {
  assertInstanceNotNull(_instance);

  // Syncing the entities
  // TODO: we are not syncing the morph weights here yet

  // Sync the same named entities:
  for (auto const& [name, masterEntity] : _entityMap) {
    auto instanceEntity = entitiesNameMap[name];
    if (instanceEntity.isNull()) {
      [[unlikely]];
      continue;
    }

    // Sync the transform
    TransformManager::Instance masterTransformInstance = _transformManager.getInstance(masterEntity);
    TransformManager::Instance instanceTransformInstance = _transformManager.getInstance(instanceEntity);

    if (!masterTransformInstance.isValid() || !instanceTransformInstance.isValid()) {
      [[unlikely]];
      Logger::log(TAG, "Transform instanceToSync is for entity named %s is invalid", name.c_str());
      continue;
    }

    math::mat4f masterTransform = _transformManager.getTransform(masterTransformInstance);
    _transformManager.setTransform(instanceTransformInstance, masterTransform);
  }
}

void AnimatorWrapper::syncInstances() {
  _transformManager.openLocalTransformTransaction();

  for (auto const& [id, instanceToSync] : _syncMap) {
    EntityNameMap entityNameMap = _instanceEntityMap[id];
    if (entityNameMap.empty()) {
      [[unlikely]];
      continue;
    }

    applyAnimationTo(entityNameMap);

#if HAS_FILAMENT_ANIMATOR_PATCH
    Animator* masterAnimator = _instance->getAnimator();
    masterAnimator->updateBoneMatricesForInstance(instanceToSync);
#endif
  }

  _transformManager.commitLocalTransformTransaction();
}

TransformManager& AnimatorWrapper::getTransformManager() {
  const FilamentAsset* asset = _instance->getAsset();
  Engine* engine = asset->getEngine();
  return engine->getTransformManager();
}

} // namespace margelo
