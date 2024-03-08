#include "FilamentAssetWrapper.h"

#include <utils/Entity.h>
#include <utils/EntityInstance.h>

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
  return std::make_shared<AnimatorWrapper>(_asset);
}

std::shared_ptr<AnimatorWrapper> FilamentAssetWrapper::createAnimatorWithAnimationsFrom(std::shared_ptr<FilamentAssetWrapper> otherAsset) {
#if ANDROID
  // TODO(copy-animations): We currently copy animations from an asset onto another instance (different model than the original asset), we
  // should replace this with once we found a good solution discussed here: https://github.com/google/filament/issues/7622
  Animator* animator = new gltfio::Animator(otherAsset->_asset.get(), _asset->getInstance());
  return std::make_shared<AnimatorWrapper>(_asset, animator);
#else
  return getAnimator();
#endif
}

} // namespace margelo
