//
// Created by Hanno Gödecke on 20.03.24.
//

#include "RenderableManagerWrapper.h"

namespace margelo {
void RenderableManagerWrapper::loadHybridMethods() {
  registerHybridMethod("getPrimitiveCount", &RenderableManagerWrapper::getPrimitiveCount, this);
  registerHybridMethod("getMaterialInstanceAt", &RenderableManagerWrapper::getMaterialInstanceAt, this);
  registerHybridMethod("setMaterialInstanceAt", &RenderableManagerWrapper::setMaterialInstanceAt, this);
  registerHybridMethod("setAssetEntitiesOpacity", &RenderableManagerWrapper::setAssetEntitiesOpacity, this);
}

int RenderableManagerWrapper::getPrimitiveCount(std::shared_ptr<EntityWrapper> entity) {
  Entity entityInstance = entity->getEntity();
  RenderableManager::Instance renderable = _renderableManager.getInstance(entityInstance);
  return _renderableManager.getPrimitiveCount(renderable);
}

std::shared_ptr<MaterialInstanceWrapper> RenderableManagerWrapper::getMaterialInstanceAt(std::shared_ptr<EntityWrapper> entity, int index) {
  Entity entityInstance = entity->getEntity();
  RenderableManager::Instance renderable = _renderableManager.getInstance(entityInstance);
  // Note: the material instance pointer is managed by the renderable manager and should not be deleted by the user
  MaterialInstance* materialInstance = _renderableManager.getMaterialInstanceAt(renderable, index);
  return std::make_shared<MaterialInstanceWrapper>(materialInstance);
}

void RenderableManagerWrapper::setAssetEntitiesOpacity(std::shared_ptr<FilamentAssetWrapper> asset, double opacity) {
  std::shared_ptr<FilamentAsset> fAsset = asset->getAsset();
  size_t entityCount = fAsset->getEntityCount();

  // Get the pointer to the first entity
  const Entity* entities = fAsset->getRenderableEntities();

  for (size_t i = 0; i < entityCount; ++i) {
    Entity entity = entities[i];
    RenderableManager::Instance renderable = _renderableManager.getInstance(entity);
    size_t primitiveCount = _renderableManager.getPrimitiveCount(renderable);
    for (size_t j = 0; j < primitiveCount; ++j) {
      MaterialInstance* materialInstance = _renderableManager.getMaterialInstanceAt(renderable, j);
      MaterialInstanceWrapper::changeAlpha(materialInstance, opacity);
      // Replace the material instance in the renderable manager
      _renderableManager.setMaterialInstanceAt(renderable, j, materialInstance);
    }
  }
}
void RenderableManagerWrapper::setMaterialInstanceAt(std::shared_ptr<EntityWrapper> entity, int index,
                                                     std::shared_ptr<MaterialInstanceWrapper> materialInstance) {
  Entity entityInstance = entity->getEntity();
  RenderableManager::Instance renderable = _renderableManager.getInstance(entityInstance);
  _renderableManager.setMaterialInstanceAt(renderable, index, materialInstance->getMaterialInstance());
}

} // namespace margelo