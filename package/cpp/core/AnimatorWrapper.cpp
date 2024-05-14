//
// Created by Hanno Gödecke on 29.02.24.
//

#include "AnimatorWrapper.h"

namespace margelo {
void AnimatorWrapper::loadHybridMethods() {
  registerHybridMethod("addInstance", &AnimatorWrapper::addInstance, this);
  registerHybridMethod("applyAnimation", &AnimatorWrapper::applyAnimation, this);
  registerHybridMethod("applyAnimationToAsset", &AnimatorWrapper::applyAnimationToAsset, this);
  registerHybridMethod("updateBoneMatrices", &AnimatorWrapper::updateBoneMatrices, this);
  registerHybridMethod("updateBoneMatricesForInstance", &AnimatorWrapper::updateBoneMatricesForInstance, this);
  registerHybridMethod("applyCrossFade", &AnimatorWrapper::applyCrossFade, this);
  registerHybridMethod("resetBoneMatrices", &AnimatorWrapper::resetBoneMatrices, this);
  registerHybridMethod("getAnimationCount", &AnimatorWrapper::getAnimationCount, this);
  registerHybridMethod("getAnimationDuration", &AnimatorWrapper::getAnimationDuration, this);
  registerHybridMethod("getAnimationName", &AnimatorWrapper::getAnimationName, this);
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

void AnimatorWrapper::addInstance(std::shared_ptr<FilamentInstanceWrapper> instanceWrapper) {
  std::unique_lock lock(_mutex);
  assetAnimatorNotNull(_animator);

  if (instanceWrapper == nullptr) {
    [[unlikely]];
    throw std::invalid_argument("Instance must not be null");
  }

  FilamentInstance* instance = instanceWrapper->getInstance();
  _animator->addInstance(instance);
}

void AnimatorWrapper::applyAnimation(int animationIndex, double time) {
  std::unique_lock lock(_mutex);
  assetAnimatorNotNull(_animator);
  assertAnimationIndexSmallerThan(animationIndex, _animator->getAnimationCount());
  _animator->applyAnimation(animationIndex, time);
}

void AnimatorWrapper::applyAnimationToAsset(int animationIndex, double time, std::shared_ptr<FilamentAssetWrapper> assetWrapper) {
  std::unique_lock lock(_mutex);
  assetAnimatorNotNull(_animator);
  assertAnimationIndexSmallerThan(animationIndex, _animator->getAnimationCount());

  if (assetWrapper == nullptr) {
    [[unlikely]];
    throw std::invalid_argument("Asset must not be null");
  }
  std::shared_ptr<FilamentAsset> asset = assetWrapper->getAsset();
  _animator->applyAnimation(animationIndex, time, asset.get());
}

void AnimatorWrapper::updateBoneMatrices() {
  std::unique_lock lock(_mutex);
  assetAnimatorNotNull(_animator);
  _animator->updateBoneMatrices();
}

void AnimatorWrapper::updateBoneMatricesForInstance(std::shared_ptr<FilamentInstanceWrapper> instanceWrapper) {
  std::unique_lock lock(_mutex);
  assetAnimatorNotNull(_animator);

  if (instanceWrapper == nullptr) {
    [[unlikely]];
    throw std::invalid_argument("Instance must not be null");
  }

  FilamentInstance* instance = instanceWrapper->getInstance();
  _animator->updateBoneMatricesForInstance(instance);
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

} // namespace margelo
