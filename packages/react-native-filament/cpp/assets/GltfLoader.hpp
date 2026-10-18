#pragma once

#include <filament/Engine.h>
#include <gltfio/AssetLoader.h>
#include <gltfio/MaterialProvider.h>
#include <utils/NameComponentManager.h>

#include <memory>

namespace margelo::nitro::filament {

class GltfLoader final {
public:
  explicit GltfLoader(::filament::Engine& engine);
  ~GltfLoader();
  GltfLoader(const GltfLoader&) = delete;
  GltfLoader& operator=(const GltfLoader&) = delete;

  ::filament::gltfio::AssetLoader& assetLoader();

private:
  struct AssetLoaderDeleter {
    void operator()(::filament::gltfio::AssetLoader* loader) const;
  };

  std::unique_ptr<::filament::gltfio::MaterialProvider> materials_;
  std::unique_ptr<utils::NameComponentManager> names_;
  std::unique_ptr<::filament::gltfio::AssetLoader, AssetLoaderDeleter> assetLoader_;
};

} // namespace margelo::nitro::filament
