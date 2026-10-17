#include "ModelSnapshot.hpp"

#include "utils/EntityConversion.hpp"

#include <gltfio/Animator.h>
#include <gltfio/FilamentInstance.h>

namespace margelo::nitro::filament {

namespace {

  std::vector<double> toEntityIds(const utils::Entity* entities, size_t count) {
    std::vector<double> ids;
    ids.reserve(count);
    for (size_t i = 0; i < count; i++) {
      ids.push_back(fromEntity(entities[i]));
    }
    return ids;
  }

  std::vector<AnimationInfo> captureAnimations(::filament::gltfio::Animator& animator) {
    std::vector<AnimationInfo> animations;
    for (size_t i = 0; i < animator.getAnimationCount(); i++) {
      const char* name = animator.getAnimationName(i);
      animations.emplace_back(name == nullptr ? "" : name, animator.getAnimationDuration(i));
    }
    return animations;
  }

  ModelInstanceSnapshot captureInstance(::filament::gltfio::FilamentInstance& instance) {
    return {
        .rootEntity = fromEntity(instance.getRoot()),
        .entities = toEntityIds(instance.getEntities(), instance.getEntityCount()),
        .animations = captureAnimations(*instance.getAnimator()),
    };
  }

  Aabb toAabb(const ::filament::Aabb& box) {
    auto center = box.center();
    auto halfExtent = box.extent();
    return Aabb(std::make_tuple(center.x, center.y, center.z), std::make_tuple(halfExtent.x, halfExtent.y, halfExtent.z));
  }

} // namespace

ModelSnapshot ModelSnapshot::capture(::filament::gltfio::FilamentAsset& asset) {
  ModelSnapshot snapshot{
      .rootEntity = fromEntity(asset.getRoot()),
      .entities = toEntityIds(asset.getEntities(), asset.getEntityCount()),
      .boundingBox = toAabb(asset.getBoundingBox()),
  };
  for (size_t i = 0; i < asset.getAssetInstanceCount(); i++) {
    snapshot.instances.push_back(captureInstance(*asset.getAssetInstances()[i]));
  }
  for (size_t i = 0; i < asset.getEntityCount(); i++) {
    if (const char* name = asset.getName(asset.getEntities()[i])) {
      snapshot.entitiesByName.try_emplace(name, fromEntity(asset.getEntities()[i]));
    }
  }
  return snapshot;
}

std::optional<double> ModelSnapshot::entityByName(const std::string& name) const {
  auto found = entitiesByName.find(name);
  if (found == entitiesByName.end()) {
    return std::nullopt;
  }
  return found->second;
}

} // namespace margelo::nitro::filament
