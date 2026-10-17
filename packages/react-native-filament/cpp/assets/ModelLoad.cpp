#include "ModelLoad.hpp"

#include <stdexcept>

namespace margelo::nitro::filament {

ModelLoad::ModelLoad(::filament::Engine& engine, ::filament::gltfio::AssetLoader& loader, ::filament::gltfio::FilamentAsset* asset,
                     Completion completion)
    : loader_(loader), asset_(asset), completion_(std::move(completion)), stbProvider_(::filament::gltfio::createStbProvider(&engine)),
      ktx2Provider_(::filament::gltfio::createKtx2Provider(&engine)),
      resourceLoader_(std::make_unique<::filament::gltfio::ResourceLoader>(
          ::filament::gltfio::ResourceConfiguration{.engine = &engine, .normalizeSkinningWeights = true})) {
  resourceLoader_->addTextureProvider("image/png", stbProvider_.get());
  resourceLoader_->addTextureProvider("image/jpeg", stbProvider_.get());
  resourceLoader_->addTextureProvider("image/ktx2", ktx2Provider_.get());
}

bool ModelLoad::begin() {
  if (resourceLoader_->asyncBeginLoad(asset_)) {
    return true;
  }
  fail(std::make_exception_ptr(std::invalid_argument(
      "FilamentAssetError: The model's buffers and textures could not be loaded. Only self-contained .glb files are supported.")));
  return false;
}

bool ModelLoad::update() {
  resourceLoader_->asyncUpdateLoad();
  if (resourceLoader_->asyncGetLoadProgress() < 1.0f) {
    return false;
  }
  resourceLoader_.reset();
  completion_(asset_, nullptr);
  return true;
}

void ModelLoad::cancel(std::exception_ptr reason) {
  resourceLoader_->asyncCancelLoad();
  fail(std::move(reason));
}

void ModelLoad::fail(std::exception_ptr reason) {
  resourceLoader_.reset();
  loader_.destroyAsset(asset_);
  completion_(nullptr, std::move(reason));
}

} // namespace margelo::nitro::filament
