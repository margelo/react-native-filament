//
// Created by Hanno Gödecke on 29.02.24.
//

#pragma once

#include "FilamentAssetWrapper.h"
#include "FilamentInstanceWrapper.h"
#include "jsi/HybridObject.h"
#include <gltfio/Animator.h>

namespace margelo {

using namespace filament::gltfio;

class AnimatorWrapper : public HybridObject {
public:
  explicit AnimatorWrapper(Animator* animator) : HybridObject("AnimatorWrapper"), _animator(animator) {}

  void loadHybridMethods() override;

private: // Exposed JS API
  void addInstance(std::shared_ptr<FilamentInstanceWrapper> instanceWrapper);
  void applyAnimation(int animationIndex, double time);
  void applyAnimationToAsset(int animationIndex, double time, std::shared_ptr<FilamentAssetWrapper> assetWrapper);
  void applyCrossFade(int previousAnimationIndex, double previousAnimationTime, double alpha);
  void updateBoneMatrices();
  void updateBoneMatricesForInstance(std::shared_ptr<FilamentInstanceWrapper> instanceWrapper);
  void resetBoneMatrices();
  int getAnimationCount();
  double getAnimationDuration(int animationIndex);
  std::string getAnimationName(int animationIndex);

protected:
  std::mutex _mutex;
  Animator* _animator;
};

} // namespace margelo
