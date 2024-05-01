//
// Created by Hanno Gödecke on 17.04.24.
//

#pragma once

#include "RenderableManagerImpl.h"
#include "jsi/PointerHolder.h"

namespace margelo {

class RenderableManagerWrapper : public PointerHolder<RenderableManagerImpl> {
public:
  RenderableManagerWrapper(std::shared_ptr<RenderableManagerImpl> renderableManagerImpl)
      : PointerHolder("RenderableManagerWrapper", renderableManagerImpl) {}

  void loadHybridMethods() override;

public: // Public APIs to be used by other native classes, not exposed to JS
  Texture* createTextureFromBuffer(std::shared_ptr<FilamentBuffer> buffer, const std::string& textureFlags);

private: // Exposed JS API
  int getPrimitiveCount(std::shared_ptr<EntityWrapper> entity);
  std::shared_ptr<MaterialInstanceWrapper> getMaterialInstanceAt(std::shared_ptr<EntityWrapper> entity, int index);
  void setMaterialInstanceAt(std::shared_ptr<EntityWrapper> entity, int index, std::shared_ptr<MaterialInstanceWrapper> materialInstance);
  void setAssetEntitiesOpacity(std::shared_ptr<FilamentAssetWrapper> asset, double opacity);
  void setInstanceWrapperEntitiesOpacity(std::shared_ptr<FilamentInstanceWrapper> instanceWrapper, double opacity);
  void changeMaterialTextureMap(std::shared_ptr<EntityWrapper> entityWrapper, const std::string& materialName,
                                std::shared_ptr<FilamentBuffer> textureBuffer, const std::string& textureFlags = "none");
  void setCastShadow(std::shared_ptr<EntityWrapper> entityWrapper, bool castShadow);

  void setReceiveShadow(std::shared_ptr<EntityWrapper> entityWrapper, bool receiveShadow);

  std::shared_ptr<EntityWrapper> createPlane(std::shared_ptr<MaterialWrapper> materialWrapper, double halfExtendX, double halfExtendY,
                                             double halfExtendZ);
  void scaleBoundingBox(std::shared_ptr<FilamentAssetWrapper> assetWrapper, double scaleFactor);
};

} // namespace margelo
