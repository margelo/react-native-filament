#pragma once

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
  explicit SceneWrapper(const std::shared_ptr<Scene>& scene, std::shared_ptr<gltfio::AssetLoader> assetLoader)
      : HybridObject("SceneWrapper"), _scene(scene), _assetLoader(assetLoader) {}
  ~SceneWrapper() override;

  void loadHybridMethods() override;

  std::shared_ptr<Scene> getScene() {
    return _scene;
  }

  void addAsset(std::shared_ptr<gltfio::FilamentAsset> asset);
  void removeAsset(std::shared_ptr<gltfio::FilamentAsset> asset);

private:
  std::vector<std::shared_ptr<gltfio::FilamentAsset>> _assets;
  std::shared_ptr<Scene> _scene;

private:
  void addEntity(std::shared_ptr<EntityWrapper> entity);
  std::shared_ptr<gltfio::AssetLoader> _assetLoader;
};
} // namespace margelo
