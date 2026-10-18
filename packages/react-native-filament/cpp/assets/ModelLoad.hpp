#pragma once

#include <filament/Engine.h>
#include <gltfio/AssetLoader.h>
#include <gltfio/FilamentAsset.h>
#include <gltfio/ResourceLoader.h>
#include <gltfio/TextureProvider.h>

#include <exception>
#include <functional>
#include <memory>

namespace margelo::nitro::filament {

class ModelLoad final {
public:
  using Completion = std::function<void(::filament::gltfio::FilamentAsset* asset, std::exception_ptr error)>;

  ModelLoad(::filament::Engine& engine, ::filament::gltfio::AssetLoader& loader, ::filament::gltfio::FilamentAsset* asset,
            Completion completion);

  bool begin();
  bool update();
  void cancel(std::exception_ptr reason);

private:
  void fail(std::exception_ptr reason);

  ::filament::gltfio::AssetLoader& loader_;
  ::filament::gltfio::FilamentAsset* asset_;
  Completion completion_;
  std::unique_ptr<::filament::gltfio::TextureProvider> stbProvider_;
  std::unique_ptr<::filament::gltfio::TextureProvider> ktx2Provider_;
  std::unique_ptr<::filament::gltfio::ResourceLoader> resourceLoader_;
};

} // namespace margelo::nitro::filament
