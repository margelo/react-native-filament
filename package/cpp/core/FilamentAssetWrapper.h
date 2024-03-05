#pragma once

#include "AnimatorWrapper.h"
#include "core/utils/EntityWrapper.h"
#include "jsi/HybridObject.h"
#include <filament/TransformManager.h>
#include <gltfio/FilamentAsset.h>

namespace margelo {

using namespace filament;

class FilamentAssetWrapper : public HybridObject {
public:
  explicit FilamentAssetWrapper(std::shared_ptr<gltfio::FilamentAsset> asset) : HybridObject("FilamentAssetWrapper"), _asset(asset) {}

  void loadHybridMethods() override;

  void transformToUnitCube(TransformManager& transformManager);

  Entity getRoot2() {
    return _asset->getRoot();
  }

private:
  std::shared_ptr<EntityWrapper> getRoot();
  void releaseSourceData();
  std::shared_ptr<AnimatorWrapper> getAnimator();
  std::shared_ptr<AnimatorWrapper> createAnimatorWithAnimationsFrom(std::shared_ptr<FilamentAssetWrapper> otherAsset);

private:
  std::shared_ptr<gltfio::FilamentAsset> _asset;
};

} // namespace margelo
