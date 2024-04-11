#pragma once

#include "FilamentAssetWrapper.h"
#include "core/utils/EntityWrapper.h"
#include "jsi/HybridObject.h"

#include <filament/Scene.h>
#include <gltfio/AssetLoader.h>
#include <gltfio/FilamentAsset.h>
#include <utils/Entity.h>

namespace margelo {
using namespace filament;

class SceneWrapper : public HybridObject {
public:
  explicit SceneWrapper(const std::shared_ptr<Scene>& scene, const std::shared_ptr<gltfio::AssetLoader>& assetLoader)
      : HybridObject("SceneWrapper"), _scene(scene), _assetLoader(assetLoader) {}

  void loadHybridMethods() override;

  const std::shared_ptr<Scene>& getScene() {
    return _scene;
  }

  void addAsset(const std::shared_ptr<gltfio::FilamentAsset>& asset);
  void removeAsset(const std::shared_ptr<gltfio::FilamentAsset>& asset);

private:
  std::mutex _mutex;
  std::shared_ptr<Scene> _scene;
  std::shared_ptr<gltfio::AssetLoader> _assetLoader;

private: // Public JS API
  void addEntity(const std::shared_ptr<EntityWrapper>& entity);
  void removeEntity(const std::shared_ptr<EntityWrapper>& entity);
  /**
   * Removed all entities associated with the provided asset from the scene.
   */
  void removeAssetEntities(const std::shared_ptr<FilamentAssetWrapper>& asset);
  /**
   * Adds all entities associated with the provided asset to the scene.
   */
  void addAssetEntities(const std::shared_ptr<FilamentAssetWrapper>& asset);

  int getEntityCount();
};
} // namespace margelo
