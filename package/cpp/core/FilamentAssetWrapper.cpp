#include "FilamentAssetWrapper.h"

#include <filament/Engine.h>
#include <utils/Entity.h>
#include <utils/EntityInstance.h>

#if defined(__APPLE__)
#include <TargetConditionals.h>
#endif

namespace margelo {

using namespace utils;

void FilamentAssetWrapper::loadHybridMethods() {
  registerHybridMethod("getRoot", &FilamentAssetWrapper::getRoot, this);
  registerHybridMethod("releaseSourceData", &FilamentAssetWrapper::releaseSourceData, this);
  registerHybridMethod("getAnimator", &FilamentAssetWrapper::getAnimator, this);
  registerHybridMethod("createAnimatorWithAnimationsFrom", &FilamentAssetWrapper::createAnimatorWithAnimationsFrom, this);
}

/**
 * Sets up a root transform on the current model to make it fit into a unit cube.
 */
void FilamentAssetWrapper::transformToUnitCube(TransformManager& transformManager) {
  Aabb aabb = _asset->getBoundingBox();
  math::details::TVec3<float> center = aabb.center();
  math::details::TVec3<float> halfExtent = aabb.extent();
  float maxExtent = max(halfExtent) * 2.0f;
  float scaleFactor = 2.0f / maxExtent;
  math::mat4f transform = math::mat4f::scaling(scaleFactor) * math::mat4f::translation(-center);
  EntityInstance<TransformManager> transformInstance = transformManager.getInstance(_asset->getRoot());
  transformManager.setTransform(transformInstance, transform);
}

std::shared_ptr<EntityWrapper> FilamentAssetWrapper::getRoot() {
  Entity rootEntity = _asset->getRoot();
  return std::make_shared<EntityWrapper>(rootEntity);
}

void FilamentAssetWrapper::releaseSourceData() {
  _asset->releaseSourceData();
}

std::shared_ptr<AnimatorWrapper> FilamentAssetWrapper::getAnimator() {
  Animator* animator = _asset->getInstance()->getAnimator();
  // Note: i haven't found anyway to cleanup the animator, in the sample code they just set it to nullptr
  // I believe it's memory gets cleaned up when the asset is destroyed.
  return std::make_shared<AnimatorWrapper>(animator);
}

std::shared_ptr<AnimatorWrapper> FilamentAssetWrapper::createAnimatorWithAnimationsFrom(std::shared_ptr<FilamentAssetWrapper> otherAsset) {
#if defined(TARGET_OS_IPHONE) || defined(TARGET_IPHONE_SIMULATOR)
    return getAnimator();
#else
  // Note: This constructor is only availbe on android yet where we build filament from source.
  // Should be unified once https://github.com/google/filament/issues/7622 is resolved.
  Animator* animator = new gltfio::Animator(otherAsset->_asset.get(), _asset->getInstance());
  return std::make_shared<AnimatorWrapper>(animator);
#endif
}

} // namespace margelo
