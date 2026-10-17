#include "ModelCore.hpp"

#include "SkeletonFollower.hpp"
#include "scene/SceneCore.hpp"
#include "utils/EntityConversion.hpp"

#include <stdexcept>

namespace margelo::nitro::filament {

ModelCore::ModelCore(std::shared_ptr<EngineCore> engine, ::filament::gltfio::FilamentAsset* asset)
    : Resource("Model"), engine_(std::move(engine)), asset_(asset), snapshot_(ModelSnapshot::capture(*asset)) {
  for (size_t i = 0; i < asset->getEntityCount(); i++) {
    entities_.push_back(fromEntity(asset->getEntities()[i]));
  }
  for (size_t i = 0; i < asset->getAssetInstanceCount(); i++) {
    instances_.push_back(std::make_shared<const ModelInstanceSnapshot>(ModelInstanceSnapshot::capture(*asset->getAssetInstances()[i])));
  }
}

namespace {

  void releaseMaterials(EngineCore& engine, ::filament::gltfio::FilamentAsset& asset) {
    for (size_t i = 0; i < asset.getAssetInstanceCount(); i++) {
      ::filament::gltfio::FilamentInstance& instance = *asset.getAssetInstances()[i];
      engine.materialAssignments().releaseEntities(asset.getEntities(), asset.getEntityCount(), instance.getMaterialInstances(),
                                                   instance.getMaterialInstanceCount());
    }
  }

} // namespace

ModelCore::~ModelCore() {
  if (!isDestroyed()) {
    engine_->thread().post({.run = [engine = engine_, asset = asset_] {
      releaseMaterials(*engine, *asset);
      engine->gltf().assetLoader().destroyAsset(asset);
    }});
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

std::vector<double> ModelCore::entities() const {
  std::unique_lock lock(instancesMutex_);
  return entities_;
}

size_t ModelCore::instanceCount() const {
  std::unique_lock lock(instancesMutex_);
  return instances_.size();
}

std::shared_ptr<const ModelInstanceSnapshot> ModelCore::instanceSnapshot(size_t index) const {
  std::unique_lock lock(instancesMutex_);
  return instances_.at(index);
}

size_t ModelCore::createInstance() {
  ::filament::gltfio::FilamentInstance* created = engine_->gltf().assetLoader().createInstance(asset_);
  if (created == nullptr) {
    throw std::runtime_error("Model.createInstance(): gltfio could not create another instance of this model.");
  }
  auto snapshot = std::make_shared<const ModelInstanceSnapshot>(ModelInstanceSnapshot::capture(*created));
  size_t index;
  {
    std::unique_lock lock(instancesMutex_);
    entities_.insert(entities_.end(), snapshot->entities.begin(), snapshot->entities.end());
    instances_.push_back(snapshot);
    index = instances_.size() - 1;
  }
  users_.forEach(
      [&](const std::shared_ptr<SceneCore>& scene) { scene->scene().addEntities(created->getEntities(), created->getEntityCount()); });
  return index;
}

void ModelCore::setSkeletonFollower(size_t instanceIndex, std::shared_ptr<SkeletonFollower> follower) {
  if (follower == nullptr) {
    skeletonFollowers_.erase(instanceIndex);
  } else {
    skeletonFollowers_[instanceIndex] = std::move(follower);
  }
}

Users<SceneCore>& ModelCore::users() {
  return users_;
}

void ModelCore::destroyNative() {
  auto self = std::static_pointer_cast<ModelCore>(shared_from_this());
  users_.forEach([&](const std::shared_ptr<SceneCore>& scene) { scene->removeModel(self); });
  skeletonFollowers_.clear();
  releaseMaterials(*engine_, *asset_);
  engine_->gltf().assetLoader().destroyAsset(asset_);
}

} // namespace margelo::nitro::filament
