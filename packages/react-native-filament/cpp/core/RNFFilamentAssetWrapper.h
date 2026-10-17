#pragma once

#include "RNFAABBWrapper.h"
#include "RNFNameComponentManagerWrapper.h"
#include "core/utils/RNFEntityWrapper.h"
#include "jsi/RNFPointerHolder.h"
#include <filament/TransformManager.h>
#include <gltfio/FilamentAsset.h>

namespace margelo {

class SceneWrapper;
class AnimatorWrapper;
class FilamentInstanceWrapper;

using namespace filament;

class FilamentAssetWrapper : public PointerHolder<gltfio::FilamentAsset> {
public:
  explicit FilamentAssetWrapper(std::shared_ptr<gltfio::FilamentAsset> asset) : PointerHolder("FilamentAssetWrapper", asset) {}

  void loadHybridMethods() override;

  std::shared_ptr<gltfio::FilamentAsset> getAsset() {
    return pointee();
  }

private: // Public API functions:
  std::shared_ptr<EntityWrapper> getRoot();
  void releaseSourceData();
  std::shared_ptr<AnimatorWrapper> createAnimator(std::shared_ptr<NameComponentManagerWrapper> nameComponentManagerWrapper);
  int getEntityCount() {
    return pointee()->getEntityCount();
  }
  std::vector<std::shared_ptr<EntityWrapper>> getEntities();
  int getRenderableEntityCount() {
    return pointee()->getRenderableEntityCount();
  }
  std::vector<std::shared_ptr<EntityWrapper>> getRenderableEntities();
  std::shared_ptr<AABBWrapper> getBoundingBox() {
    Aabb aabb = pointee()->getBoundingBox();
    return std::make_shared<AABBWrapper>(aabb);
  }

  std::optional<std::shared_ptr<EntityWrapper>> getFirstEntityByName(const std::string& name);

  // Convenience method to get the first instance
  std::shared_ptr<FilamentInstanceWrapper> getInstance();
  std::vector<std::shared_ptr<FilamentInstanceWrapper>> getAssetInstances();

  std::string getMorphTargetNameAt(const std::shared_ptr<EntityWrapper>& entity, int32_t targetIndex);
  int32_t getMorphTargetCountAt(const std::shared_ptr<EntityWrapper>& entity);
  ;

private: // Internal state:
  std::mutex _mutex;
};

} // namespace margelo
