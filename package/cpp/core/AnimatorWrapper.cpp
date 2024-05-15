//
// Created by Hanno Gödecke on 29.02.24.
//

#include "AnimatorWrapper.h"
#include "GlobalNameComponentManager.h"
#include <filament/Engine.h>
#include <filament/TransformManager.h>
#include <utils/NameComponentManager.h>

namespace margelo {
void AnimatorWrapper::loadHybridMethods() {
  registerHybridMethod("applyAnimation", &AnimatorWrapper::applyAnimation, this);
  registerHybridMethod("updateBoneMatrices", &AnimatorWrapper::updateBoneMatrices, this);
  registerHybridMethod("applyCrossFade", &AnimatorWrapper::applyCrossFade, this);
  registerHybridMethod("resetBoneMatrices", &AnimatorWrapper::resetBoneMatrices, this);
  registerHybridMethod("getAnimationCount", &AnimatorWrapper::getAnimationCount, this);
  registerHybridMethod("getAnimationDuration", &AnimatorWrapper::getAnimationDuration, this);
  registerHybridMethod("getAnimationName", &AnimatorWrapper::getAnimationName, this);
  registerHybridMethod("addToSyncList", &AnimatorWrapper::addToSyncList, this);
  registerHybridMethod("removeFromSyncList", &AnimatorWrapper::removeFromSyncList, this);
}

inline void assertAnimationIndexSmallerThan(int animationIndex, int max) {
  if (animationIndex >= max || animationIndex < 0) {
    [[unlikely]];
    throw std::invalid_argument("Animation index out of range! Expected <" + std::to_string(max) + ", received " +
                                std::to_string(animationIndex));
  }
}

inline void assetAnimatorNotNull(Animator* animator) {
  if (animator == nullptr) {
    [[unlikely]];
    throw std::runtime_error("Failed to call animator method, as the internal animator was null. You probably tried to access the animator "
                             "after calling .release()");
  }
}

inline void assetInstanceNotNull(FilamentInstance* instance) {
  if (instance == nullptr) {
    [[unlikely]];
    throw std::runtime_error("Failed to call animator method, as the internal instance was null. You probably tried to access the animator "
                             "after calling .release()");
  }
}

void AnimatorWrapper::applyAnimation(int animationIndex, double time) {
  std::unique_lock lock(_mutex);
  assetAnimatorNotNull(_animator);
  assertAnimationIndexSmallerThan(animationIndex, _animator->getAnimationCount());
  _animator->applyAnimation(animationIndex, time);
}

void AnimatorWrapper::updateBoneMatrices() {
  std::unique_lock lock(_mutex);
  assetAnimatorNotNull(_animator);
  _animator->updateBoneMatrices();

  // Sync the instances
  for (auto const& [id, instanceToSync] : _syncMap) {
    assetInstanceNotNull(instanceToSync);
    applyAnimationToInstance(instanceToSync);
  }
}

void AnimatorWrapper::applyCrossFade(int previousAnimationIndex, double previousAnimationTime, double alpha) {
  std::unique_lock lock(_mutex);
  assetAnimatorNotNull(_animator);
  assertAnimationIndexSmallerThan(previousAnimationIndex, _animator->getAnimationCount());
  _animator->applyCrossFade(previousAnimationIndex, previousAnimationTime, alpha);
}

void AnimatorWrapper::resetBoneMatrices() {
  std::unique_lock lock(_mutex);
  assetAnimatorNotNull(_animator);
  _animator->resetBoneMatrices();

  // Sync the instances
  for (auto const& [id, instanceToSync] : _syncMap) {
    assetInstanceNotNull(instanceToSync);
    applyAnimationToInstance(instanceToSync);
  }
}

int AnimatorWrapper::getAnimationCount() {
  std::unique_lock lock(_mutex);
  assetAnimatorNotNull(_animator);
  return _animator->getAnimationCount();
}

double AnimatorWrapper::getAnimationDuration(int animationIndex) {
  std::unique_lock lock(_mutex);
  assetAnimatorNotNull(_animator);
  return _animator->getAnimationDuration(animationIndex);
}

std::string AnimatorWrapper::getAnimationName(int animationIndex) {
  std::unique_lock lock(_mutex);
  assetAnimatorNotNull(_animator);
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
  _syncMap.insert({id, instance});

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
}

void AnimatorWrapper::applyAnimationToInstance(FilamentInstance* instanceToSync) {
  assetInstanceNotNull(instanceToSync);
  assetInstanceNotNull(_instance);

  FilamentInstance* masterInstance = _instance;

  const FilamentAsset* asset = instanceToSync->getAsset();
  Engine* engine = asset->getEngine();
  TransformManager& transformManager = engine->getTransformManager();
  Animator* masterAnimator = masterInstance->getAnimator();

  // Syncing the entities
  // TODO: we are not syncing the morph weights here yet
  // TODO: Put the name map generation into a function
  // TODO: Calculate the name map only once
  // TODO: Refactor the global name component manager pattern?
  // TODO: Wrap in transform transaction?

  // Get name map for master instanceToSync
  size_t masterEntitiesCount = masterInstance->getEntityCount();
  const Entity* masterEntities = masterInstance->getEntities();
  std::map<std::string, Entity> masterEntityMap;
  for (size_t entityIndex = 0; entityIndex < masterEntitiesCount; entityIndex++) {
    const Entity masterEntity = masterEntities[entityIndex];
    NameComponentManager::Instance masterNameInstance = GlobalNameComponentManager::getInstance()->getInstance(masterEntity);
    if (!masterNameInstance.isValid()) {
      continue;
    }
    auto masterInstanceName = GlobalNameComponentManager::getInstance()->getName(masterNameInstance);
    masterEntityMap[masterInstanceName] = masterEntity;
  }

  // Get name map for instanceToSync
  size_t instanceEntitiesCount = instanceToSync->getEntityCount();
  const Entity* instanceEntities = instanceToSync->getEntities();
  std::map<std::string, Entity> instanceEntityMap;
  for (size_t entityIndex = 0; entityIndex < instanceEntitiesCount; entityIndex++) {
    const Entity instanceEntity = instanceEntities[entityIndex];
    NameComponentManager::Instance instanceNameInstance = GlobalNameComponentManager::getInstance()->getInstance(instanceEntity);
    if (!instanceNameInstance.isValid()) {
      continue;
    }
    auto instanceName = GlobalNameComponentManager::getInstance()->getName(instanceNameInstance);
    instanceEntityMap[instanceName] = instanceEntity;
  }

  // Sync the same named entities:
  for (auto const& [name, masterEntity] : masterEntityMap) {
    auto instanceEntity = instanceEntityMap[name];
    if (instanceEntity.isNull()) {
      continue;
    }

    // Sync the transform
    TransformManager::Instance masterTransformInstance = transformManager.getInstance(masterEntity);
    TransformManager::Instance instanceTransformInstance = transformManager.getInstance(instanceEntity);

    if (!masterTransformInstance.isValid() || !instanceTransformInstance.isValid()) {
      Logger::log(TAG, "Transform instanceToSync is for entity named %s is invalid", name.c_str());
      continue;
    }

    math::mat4f masterTransform = transformManager.getTransform(masterTransformInstance);
    transformManager.setTransform(instanceTransformInstance, masterTransform);
  }

  // Syncing the bones / joints
  masterAnimator->updateBoneMatricesForInstance(instanceToSync);
}

} // namespace margelo
