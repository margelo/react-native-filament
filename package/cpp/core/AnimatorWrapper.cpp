//
// Created by Hanno Gödecke on 29.02.24.
//

#include "AnimatorWrapper.h"

#if defined(__APPLE__)
#include <TargetConditionals.h>
#endif

namespace margelo {
void AnimatorWrapper::loadHybridMethods() {
  registerHybridMethod("applyAnimation", &AnimatorWrapper::applyAnimation, this);
  registerHybridMethod("updateBoneMatrices", &AnimatorWrapper::updateBoneMatrices, this);
  registerHybridMethod("applyCrossFade", &AnimatorWrapper::applyCrossFade, this);
  registerHybridMethod("resetBoneMatrices", &AnimatorWrapper::resetBoneMatrices, this);
  registerHybridMethod("getAnimationCount", &AnimatorWrapper::getAnimationCount, this);
  registerHybridMethod("getAnimationDuration", &AnimatorWrapper::getAnimationDuration, this);
  registerHybridMethod("getAnimationName", &AnimatorWrapper::getAnimationName, this);
}

Animator* AnimatorWrapper::getAnimator() {
  if (_optionalAnimator != nullptr) {
    return _optionalAnimator;
  }

  FilamentInstance* instance = _asset->getInstance();
  if (instance == nullptr) {
    [[unlikely]];
    throw std::runtime_error("Filament Asset does not contain a valid FilamentInstance!");
  }
  return instance->getAnimator();
}

AnimatorWrapper::~AnimatorWrapper() {
  if (_optionalAnimator != nullptr) {
#if defined(TARGET_OS_IPHONE) || defined(TARGET_IPHONE_SIMULATOR)
      // On iOS we currenlty don't have the patch to create a custom animator.
#else
    delete _optionalAnimator;
#endif
  }
}

void AnimatorWrapper::applyAnimation(int animationIndex, double time) {
  Animator* animator = getAnimator();
  animator->applyAnimation(animationIndex, time);
}

void AnimatorWrapper::updateBoneMatrices() {
  Animator* animator = getAnimator();
  animator->updateBoneMatrices();
}

void AnimatorWrapper::applyCrossFade(int previousAnimationIndex, double previousAnimationTime, double alpha) {
  Animator* animator = getAnimator();
  animator->applyCrossFade(previousAnimationIndex, previousAnimationTime, alpha);
}

void AnimatorWrapper::resetBoneMatrices() {
  Animator* animator = getAnimator();
  animator->resetBoneMatrices();
}

int AnimatorWrapper::getAnimationCount() {
  Animator* animator = getAnimator();
  return animator->getAnimationCount();
}

double AnimatorWrapper::getAnimationDuration(int animationIndex) {
  Animator* animator = getAnimator();
  return animator->getAnimationDuration(animationIndex);
}

std::string AnimatorWrapper::getAnimationName(int animationIndex) {
  Animator* animator = getAnimator();
  return animator->getAnimationName(animationIndex);
}
} // namespace margelo
