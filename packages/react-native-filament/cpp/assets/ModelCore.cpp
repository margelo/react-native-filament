#include "ModelCore.hpp"

#include "scene/SceneCore.hpp"

namespace margelo::nitro::filament {

ModelCore::ModelCore(std::shared_ptr<EngineCore> engine, ::filament::gltfio::FilamentAsset* asset)
    : Resource("Model"), engine_(std::move(engine)), asset_(asset), snapshot_(ModelSnapshot::capture(*asset)) {}

ModelCore::~ModelCore() {
  if (!isDestroyed()) {
    engine_->thread().post({.run = [engine = engine_, asset = asset_] { engine->gltf().assetLoader().destroyAsset(asset); }});
  }
}

const std::shared_ptr<EngineCore>& ModelCore::engine() const {
  return engine_;
}

::filament::gltfio::FilamentAsset& ModelCore::asset() {
  return *asset_;
}

::filament::gltfio::FilamentInstance& ModelCore::instance(size_t index) {
  return *asset_->getAssetInstances()[index];
}

const ModelSnapshot& ModelCore::snapshot() const {
  return snapshot_;
}

Users<SceneCore>& ModelCore::users() {
  return users_;
}

void ModelCore::destroyNative() {
  auto self = std::static_pointer_cast<ModelCore>(shared_from_this());
  users_.forEach([&](const std::shared_ptr<SceneCore>& scene) { scene->removeModel(self); });
  engine_->gltf().assetLoader().destroyAsset(asset_);
}

} // namespace margelo::nitro::filament
