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
  /**
   * Wraps a FilamentAsset and optionally its instances.
   * @param asset The asset to wrap
   * @param instances You can create an asset with multiple instances. In this case provide the instances here, so they get memory managed
   * by this wrapper.
   */
  explicit FilamentAssetWrapper(std::shared_ptr<gltfio::FilamentAsset> asset, FilamentInstance** instances)
      : HybridObject("FilamentAssetWrapper"), _asset(asset), _instances(instances) {}

  void loadHybridMethods() override;

  void transformToUnitCube(TransformManager& transformManager);

  std::shared_ptr<gltfio::FilamentAsset> getAsset() {
    return _asset;
  }

private:
  std::shared_ptr<EntityWrapper> getRoot();
  void releaseSourceData();
  std::shared_ptr<AnimatorWrapper> getAnimator();
  std::shared_ptr<AnimatorWrapper> createAnimatorWithAnimationsFrom(std::shared_ptr<FilamentAssetWrapper> otherAsset);

private:
  std::shared_ptr<gltfio::FilamentAsset> _asset;
  // Optional instances that are managed by this wrapper
  FilamentInstance** _instances = nullptr;
};

} // namespace margelo
