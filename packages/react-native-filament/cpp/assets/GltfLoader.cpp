#include "GltfLoader.hpp"

#include <gltfio/materials/uberarchive.h>
#include <utils/EntityManager.h>

namespace margelo::nitro::filament {

GltfLoader::GltfLoader(::filament::Engine& engine)
    : materials_(::filament::gltfio::createUbershaderProvider(&engine, UBERARCHIVE_DEFAULT_DATA, UBERARCHIVE_DEFAULT_SIZE)),
      names_(std::make_unique<utils::NameComponentManager>(utils::EntityManager::get())),
      assetLoader_(::filament::gltfio::AssetLoader::create({.engine = &engine, .materials = materials_.get(), .names = names_.get()})) {}

GltfLoader::~GltfLoader() {
  assetLoader_.reset();
  materials_->destroyMaterials();
}

::filament::gltfio::AssetLoader& GltfLoader::assetLoader() {
  return *assetLoader_;
}

void GltfLoader::AssetLoaderDeleter::operator()(::filament::gltfio::AssetLoader* loader) const {
  ::filament::gltfio::AssetLoader::destroy(&loader);
}

} // namespace margelo::nitro::filament
