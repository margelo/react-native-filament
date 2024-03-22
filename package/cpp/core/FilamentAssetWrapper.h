#pragma once

#include "AABBWrapper.h"
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

  std::shared_ptr<gltfio::FilamentAsset> getAsset() {
    return _asset;
  }

private: // Public API functions:
  std::shared_ptr<EntityWrapper> getRoot();
  void releaseSourceData();
  std::shared_ptr<AnimatorWrapper> getAnimator();
  std::shared_ptr<AnimatorWrapper> createAnimatorWithAnimationsFrom(std::shared_ptr<FilamentAssetWrapper> otherAsset);
  int getEntityCount() {
    return _asset->getEntityCount();
  }
  std::vector<std::shared_ptr<EntityWrapper>> getEntities();
  int getRenderableEntityCount() {
    return _asset->getRenderableEntityCount();
  }
  std::vector<std::shared_ptr<EntityWrapper>> getRenderableEntities();
  std::shared_ptr<AABBWrapper> getBoundingBox() {
    Aabb aabb = _asset->getBoundingBox();
    return std::make_shared<AABBWrapper>(aabb);
  }

  std::optional<std::shared_ptr<EntityWrapper>> getFirstEntityByName(const std::string& name);

private: // Internal state:
  std::shared_ptr<gltfio::FilamentAsset> _asset;
};

} // namespace margelo
