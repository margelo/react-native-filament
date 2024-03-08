//
// Created by Hanno Gödecke on 29.02.24.
//

#include "AnimatorWrapper.h"

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
  FilamentInstance* instance = _asset->getInstance();
  if (instance == nullptr) {
    [[unlikely]];
    throw std::runtime_error("Filament Asset does not contain a valid FilamentInstance!");
  }
  return instance->getAnimator();
}

void AnimatorWrapper::applyAnimation(int number, double time) {
  Animator* animator = getAnimator();
  animator->applyAnimation(number, time);
}

void AnimatorWrapper::updateBoneMatrices() {
  Animator* animator = getAnimator();
  animator->updateBoneMatrices();
}

void AnimatorWrapper::applyCrossFade(int previousAnimIndex, double previousAnimTime, double alpha) {
  Animator* animator = getAnimator();
  animator->applyCrossFade(previousAnimIndex, previousAnimTime, alpha);
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