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

  // Sync the instances
  for (auto const& [id, entitiesToSync] : _syncMap) {
    applyAnimationToEntities(entitiesToSync);
  }
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

  // Sync the instances
  for (auto const& [id, entitiesToSync] : _syncMap) {
    applyAnimationToEntities(instanceToSync);
  }
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
  std::map<std::string, Entity> entityMap = getEntityNameMap(instance);
  _syncMap.insert({id, entityMap});

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

EntityNameMap AnimatorWrapper::getEntityNameMap(FilamentInstance* instance) {
  assertInstanceNotNull(instance);

  size_t masterEntitiesCount = instance->getEntityCount();
  const Entity* masterEntities = instance->getEntities();
  std::map<std::string, Entity> entityMap;
  for (size_t entityIndex = 0; entityIndex < masterEntitiesCount; entityIndex++) {
    const Entity masterEntity = masterEntities[entityIndex];
    NameComponentManager::Instance masterNameInstance = GlobalNameComponentManager::getInstance()->getInstance(masterEntity);
    if (!masterNameInstance.isValid()) {
      continue;
    }
    auto masterInstanceName = GlobalNameComponentManager::getInstance()->getName(masterNameInstance);
    entityMap[masterInstanceName] = masterEntity;
  }

  return entityMap;
}

void AnimatorWrapper::applyAnimationToEntities(EntityNameMap entitiesToSync) {
  assertInstanceNotNull(_instance);

  FilamentInstance* masterInstance = _instance;

  const FilamentAsset* asset = _instance->getAsset();
  Engine* engine = asset->getEngine();
  TransformManager& transformManager = engine->getTransformManager();
  Animator* masterAnimator = masterInstance->getAnimator();

  // Syncing the entities
  // TODO: we are not syncing the morph weights here yet
  // TODO: Put the name map generation into a function
  // TODO: Calculate the name map only once
  // TODO: Refactor the global name component manager pattern?
  // TODO: Wrap in transform transaction?

  // Get name map for master instance
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

  // Sync the same named entities:
  for (auto const& [name, masterEntity] : masterEntityMap) {
    auto instanceEntity = entitiesToSync[name];
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
