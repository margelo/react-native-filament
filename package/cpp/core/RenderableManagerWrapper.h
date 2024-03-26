//
// Created by Hanno Gödecke on 20.03.24.
//

#pragma once

#include "FilamentAssetWrapper.h"
#include "FilamentBuffer.h"
#include "MaterialInstanceWrapper.h"
#include "MaterialWrapper.h"
#include "core/utils/EntityWrapper.h"
#include "jsi/HybridObject.h"

#include <filament/RenderableManager.h>
#include <gltfio/TextureProvider.h>

namespace margelo {
using namespace filament;
using namespace gltfio;

class EngineWrapper;

class RenderableManagerWrapper : public HybridObject {
public:
  explicit RenderableManagerWrapper(RenderableManager& renderableManager, std::shared_ptr<TextureProvider> textureProvider,
                                    std::shared_ptr<Engine> engine)
      : HybridObject("RenderableManagerWrapper"), _renderableManager(renderableManager), _textureProvider(textureProvider),
        _engine(engine) {}

  void loadHybridMethods() override;

public: // Public API
  int getPrimitiveCount(std::shared_ptr<EntityWrapper> entity);
  std::shared_ptr<MaterialInstanceWrapper> getMaterialInstanceAt(std::shared_ptr<EntityWrapper> entity, int index);
  void setMaterialInstanceAt(std::shared_ptr<EntityWrapper> entity, int index, std::shared_ptr<MaterialInstanceWrapper> materialInstance);

  /**
   * Convenience method to apply the given opacity to every material of all the asset's entities.
   * Prefer to use this method over `getMaterialInstanceAt` and `setOpacity` for performance reasons.
   */
  void setAssetEntitiesOpacity(std::shared_ptr<FilamentAssetWrapper> asset, double opacity);

  /**
   * Will select the first material instance from the entity. Will set the baseColorMap parameter to the given textureBuffer.
   */
  void changeMaterialTextureMap(std::shared_ptr<EntityWrapper> entityWrapper, const std::string& materialName,
                                std::shared_ptr<FilamentBuffer> textureBuffer, std::string textureFlags = "none");

  void setCastShadow(bool castShadow, std::shared_ptr<EntityWrapper> entityWrapper);

  void setReceiveShadow(bool receiveShadow, std::shared_ptr<EntityWrapper> entityWrapper);

  std::shared_ptr<EntityWrapper> createPlane(std::shared_ptr<MaterialWrapper> materialWrapper);

  /**
   * Takes an asset, gets the bounding box of all renderable entities and updates the bounding box to be multiplied by the given scale
   * factor.
   */
  void scaleBoundingBox(std::shared_ptr<FilamentAssetWrapper> assetWrapper, double scaleFactor);

private:
  // Calls the TextureProvider to start loading the resource
  void startUpdateResourceLoading();

private:
  RenderableManager& _renderableManager;
  std::shared_ptr<TextureProvider> _textureProvider;
  std::shared_ptr<Engine> _engine;

private:
  constexpr static const char* TAG = "RenderableManagerWrapper";
};

} // namespace margelo
