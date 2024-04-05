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
  explicit AnimatorWrapper(const std::shared_ptr<FilamentAsset>& asset)
      : HybridObject("AnimatorWrapper"), _assetRef(asset), _instance(asset->getInstance()) {}

  // TODO(copy-animations): We currently copy animations from an asset onto another instance (different model than the original asset), we
  // should replace this with once we found a good solution discussed here: https://github.com/google/filament/issues/7622
  explicit AnimatorWrapper(const std::shared_ptr<FilamentAsset>& asset, Animator* optionalAnimator) : AnimatorWrapper(asset) {
    _optionalAnimator = optionalAnimator;
  }
  explicit AnimatorWrapper(FilamentInstance* instance) : HybridObject("AnimatorWrapper"), _instance(instance) {}
  ~AnimatorWrapper() override;

  void loadHybridMethods() override;

private:
  void applyAnimation(int animationIndex, double time);
  void applyCrossFade(int previousAnimationIndex, double previousAnimationTime, double alpha);
  void updateBoneMatrices();
  void resetBoneMatrices();
  int getAnimationCount();
  double getAnimationDuration(int animationIndex);
  std::string getAnimationName(int animationIndex);

  Animator* getAnimator();

private:
  // Keep a reference on the asset to avoid the animator instance being alive while the asset got already deallocated
  std::shared_ptr<FilamentAsset> _assetRef = nullptr;
  FilamentInstance* _instance;
  // TODO(copy-animations): We currently copy animations from an asset onto another instance (different model than the original asset), we
  // should replace this with once we found a good solution discussed here: https://github.com/google/filament/issues/7622
  Animator* _optionalAnimator = nullptr;
};

} // namespace margelo
