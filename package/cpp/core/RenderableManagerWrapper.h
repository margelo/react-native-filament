//
// Created by Hanno Gödecke on 20.03.24.
//

#pragma once

#include "FilamentAssetWrapper.h"
#include "MaterialInstanceWrapper.h"
#include "core/utils/EntityWrapper.h"
#include "jsi/HybridObject.h"

#include <filament/RenderableManager.h>

namespace margelo {
using namespace filament;

class RenderableManagerWrapper : public HybridObject {
public:
  explicit RenderableManagerWrapper(RenderableManager& renderableManager)
      : HybridObject("RenderableManagerWrapper"), _renderableManager(renderableManager) {}
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

private:
  RenderableManager& _renderableManager;
};

} // namespace margelo
