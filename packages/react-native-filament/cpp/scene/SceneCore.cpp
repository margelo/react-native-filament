#include "SceneCore.hpp"

#include "assets/ModelCore.hpp"
#include "targets/ViewTargetCore.hpp"

#include <algorithm>

namespace margelo::nitro::filament {

SceneCore::SceneCore(std::shared_ptr<EngineCore> engine)
    : Resource("Scene"), engine_(std::move(engine)), scene_(engine_->engine().createScene()) {}

SceneCore::~SceneCore() {
  if (!isDestroyed()) {
    engine_->thread().post({.run = [engine = engine_, scene = scene_] { engine->engine().destroy(scene); }});
  }
}

::filament::Scene& SceneCore::scene() {
  return *scene_;
}

void SceneCore::addModel(const std::shared_ptr<ModelCore>& model) {
  if (std::find(models_.begin(), models_.end(), model) != models_.end()) {
    return;
  }
  ::filament::gltfio::FilamentAsset& asset = model->asset();
  scene_->addEntities(asset.getEntities(), asset.getEntityCount());
  models_.push_back(model);
  model->users().add(self());
}

void SceneCore::removeModel(const std::shared_ptr<ModelCore>& model) {
  auto found = std::find(models_.begin(), models_.end(), model);
  if (found == models_.end()) {
    return;
  }
  ::filament::gltfio::FilamentAsset& asset = model->asset();
  scene_->removeEntities(asset.getEntities(), asset.getEntityCount());
  models_.erase(found);
  model->users().remove(self());
}

void SceneCore::setIndirectLight(const std::shared_ptr<IndirectLightCore>& light) {
  if (indirectLight_ != nullptr) {
    indirectLight_->users().remove(self());
  }
  indirectLight_ = light;
  if (indirectLight_ != nullptr) {
    indirectLight_->users().add(self());
  }
  scene_->setIndirectLight(indirectLight_ == nullptr ? nullptr : indirectLight_->indirectLight());
}

void SceneCore::setSkybox(const std::shared_ptr<SkyboxCore>& skybox) {
  if (skybox_ != nullptr) {
    skybox_->users().remove(self());
  }
  skybox_ = skybox;
  if (skybox_ != nullptr) {
    skybox_->users().add(self());
  }
  scene_->setSkybox(skybox_ == nullptr ? nullptr : skybox_->skybox());
}

Users<ViewTargetCore>& SceneCore::users() {
  return users_;
}

void SceneCore::destroyNative() {
  users_.forEach([](const std::shared_ptr<ViewTargetCore>& target) { target->setScene(nullptr); });
  std::vector<std::shared_ptr<ModelCore>> models = models_;
  for (const std::shared_ptr<ModelCore>& model : models) {
    removeModel(model);
  }
  setIndirectLight(nullptr);
  setSkybox(nullptr);
  engine_->engine().destroy(scene_);
}

std::shared_ptr<SceneCore> SceneCore::self() {
  return std::static_pointer_cast<SceneCore>(shared_from_this());
}

} // namespace margelo::nitro::filament
