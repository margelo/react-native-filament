#include "FilamentAssetWrapper.h"

#include <utils/Entity.h>
#include <utils/EntityInstance.h>

namespace margelo {

using namespace utils;

void FilamentAssetWrapper::loadHybridMethods() {
  registerHybridMethod("getRoot", &FilamentAssetWrapper::getRoot, this);
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

} // namespace margelo