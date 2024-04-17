//
// Created by Hanno Gödecke on 17.04.24.
//

#include "RenderableManagerWrapper.h"

namespace margelo {
void RenderableManagerWrapper::loadHybridMethods() {
  registerHybridMethod("getPrimitiveCount", &RenderableManagerWrapper::getPrimitiveCount, this);
  registerHybridMethod("getMaterialInstanceAt", &RenderableManagerWrapper::getMaterialInstanceAt, this);
  registerHybridMethod("setMaterialInstanceAt", &RenderableManagerWrapper::setMaterialInstanceAt, this);
  registerHybridMethod("setAssetEntitiesOpacity", &RenderableManagerWrapper::setAssetEntitiesOpacity, this);
  registerHybridMethod("setInstanceEntitiesOpacity", &RenderableManagerWrapper::setInstanceWrapperEntitiesOpacity, this);
  registerHybridMethod("changeMaterialTextureMap", &RenderableManagerWrapper::changeMaterialTextureMap, this);
  registerHybridMethod("setCastShadow", &RenderableManagerWrapper::setCastShadow, this);
  registerHybridMethod("setReceiveShadow", &RenderableManagerWrapper::setReceiveShadow, this);
  registerHybridMethod("createPlane", &RenderableManagerWrapper::createPlane, this);
  registerHybridMethod("scaleBoundingBox", &RenderableManagerWrapper::scaleBoundingBox, this);
}
int RenderableManagerWrapper::getPrimitiveCount(std::shared_ptr<EntityWrapper> entity) {
  return pointee()->getPrimitiveCount(entity);
}
std::shared_ptr<MaterialInstanceWrapper> RenderableManagerWrapper::getMaterialInstanceAt(std::shared_ptr<EntityWrapper> entity, int index) {
  return pointee()->getMaterialInstanceAt(entity, index);
}
void RenderableManagerWrapper::setMaterialInstanceAt(std::shared_ptr<EntityWrapper> entity, int index,
                                                     std::shared_ptr<MaterialInstanceWrapper> materialInstance) {
  pointee()->setMaterialInstanceAt(entity, index, materialInstance);
}
void RenderableManagerWrapper::setAssetEntitiesOpacity(std::shared_ptr<FilamentAssetWrapper> asset, double opacity) {
  pointee()->setAssetEntitiesOpacity(asset, opacity);
}
void RenderableManagerWrapper::setInstanceWrapperEntitiesOpacity(std::shared_ptr<FilamentInstanceWrapper> instanceWrapper, double opacity) {
  pointee()->setInstanceWrapperEntitiesOpacity(instanceWrapper, opacity);
}
void RenderableManagerWrapper::changeMaterialTextureMap(std::shared_ptr<EntityWrapper> entityWrapper, const std::string& materialName,
                                                        std::shared_ptr<FilamentBuffer> textureBuffer, const std::string& textureFlags) {
  pointee()->changeMaterialTextureMap(entityWrapper, materialName, textureBuffer, textureFlags);
}
void RenderableManagerWrapper::setCastShadow(std::shared_ptr<EntityWrapper> entityWrapper, bool castShadow) {
  pointee()->setCastShadow(entityWrapper, castShadow);
}
void RenderableManagerWrapper::setReceiveShadow(std::shared_ptr<EntityWrapper> entityWrapper, bool receiveShadow) {
  pointee()->setReceiveShadow(entityWrapper, receiveShadow);
}
std::shared_ptr<EntityWrapper> RenderableManagerWrapper::createPlane(std::shared_ptr<MaterialWrapper> materialWrapper, double halfExtendX,
                                                                     double halfExtendY, double halfExtendZ) {
  return pointee()->createPlane(materialWrapper, halfExtendX, halfExtendY, halfExtendZ);
}
void RenderableManagerWrapper::scaleBoundingBox(std::shared_ptr<FilamentAssetWrapper> assetWrapper, double scaleFactor) {
  pointee()->scaleBoundingBox(assetWrapper, scaleFactor);
}

} // namespace margelo