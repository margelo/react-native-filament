//
// Created by Hanno Gödecke on 29.02.24.
//

#pragma once

#include "jsi/HybridObject.h"
#include <gltfio/Animator.h>

namespace margelo {

using namespace filament::gltfio;

class AnimatorWrapper : public HybridObject {
public:
  explicit AnimatorWrapper(const std::shared_ptr<FilamentAsset>& asset) : HybridObject("AnimatorWrapper"), _asset(std::move(asset)) {}

  void loadHybridMethods() override;

private:
  void applyAnimation(int number, double time);
  void applyCrossFade(int previousAnimIndex, double previousAnimTime, double alpha);
  void updateBoneMatrices();
  void resetBoneMatrices();
  int getAnimationCount();
  double getAnimationDuration(int animationIndex);
  std::string getAnimationName(int animationIndex);

  Animator* getAnimator();

private:
  std::shared_ptr<FilamentAsset> _asset;
};

} // namespace margelo
