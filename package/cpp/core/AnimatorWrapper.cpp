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

void AnimatorWrapper::applyAnimation(int number, double time) {
  _animator->applyAnimation(number, time);
}

void AnimatorWrapper::updateBoneMatrices() {
  _animator->updateBoneMatrices();
}

void AnimatorWrapper::applyCrossFade(int previousAnimIndex, double previousAnimTime, double alpha) {
  _animator->applyCrossFade(previousAnimIndex, previousAnimTime, alpha);
}

void AnimatorWrapper::resetBoneMatrices() {
  _animator->resetBoneMatrices();
}

int AnimatorWrapper::getAnimationCount() {
  return _animator->getAnimationCount();
}

double AnimatorWrapper::getAnimationDuration(int animationIndex) {
  return _animator->getAnimationDuration(animationIndex);
}

std::string AnimatorWrapper::getAnimationName(int animationIndex) {
  return _animator->getAnimationName(animationIndex);
}
} // namespace margelo