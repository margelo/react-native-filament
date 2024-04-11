#pragma once

#include "AABBWrapper.h"
#include "AnimatorWrapper.h"
#include "FilamentInstanceWrapper.h"
#include "core/utils/EntityWrapper.h"
#include "jsi/HybridObject.h"
#include <filament/TransformManager.h>
#include <gltfio/FilamentAsset.h>

namespace margelo {

class SceneWrapper;

using namespace filament;

class FilamentAssetWrapper : public HybridObject {
public:
  explicit FilamentAssetWrapper(const std::shared_ptr<gltfio::FilamentAsset>& asset, const std::shared_ptr<SceneWrapper>& scene)
      : HybridObject("FilamentAssetWrapper"), _asset(asset), _scene(scene) {}

  void loadHybridMethods() override;

  void transformToUnitCube(TransformManager& transformManager);

  const std::shared_ptr<gltfio::FilamentAsset>& getAsset() {
    return _asset;
  }

private: // Public API functions:
  std::shared_ptr<EntityWrapper> getRoot();
  void releaseSourceData();
  std::shared_ptr<AnimatorWrapper> getAnimator();
  std::shared_ptr<AnimatorWrapper> createAnimatorWithAnimationsFrom(const std::shared_ptr<FilamentAssetWrapper>& otherAsset);
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

  // Convenience method to get the first instance
  std::shared_ptr<FilamentInstanceWrapper> getInstance();
  std::vector<std::shared_ptr<FilamentInstanceWrapper>> getAssetInstances();

private: // Internal state:
  std::mutex _mutex;
  std::shared_ptr<gltfio::FilamentAsset> _asset;
  std::shared_ptr<SceneWrapper> _scene; // The scene the asset is currently attached to
};

} // namespace margelo
