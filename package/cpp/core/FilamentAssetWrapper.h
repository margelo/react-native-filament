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
  explicit FilamentAssetWrapper(std::shared_ptr<gltfio::FilamentAsset> asset) : _asset(asset) {}

  void loadHybridMethods() override;

  void transformToUnitCube(TransformManager& transformManager);

private:
  std::shared_ptr<EntityWrapper> getRoot();
  void releaseSourceData();
  std::shared_ptr<AnimatorWrapper> getAnimator();
  void applyAnimatorTo(std::shared_ptr<FilamentAssetWrapper> other);
  std::shared_ptr<AnimatorWrapper> createAnimatorWithAnimationsFrom(std::shared_ptr<FilamentAssetWrapper> otherAsset);

private:
  std::shared_ptr<gltfio::FilamentAsset> _asset;
};

} // namespace margelo
