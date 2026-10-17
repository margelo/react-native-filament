#include "SceneCore.hpp"

#include "targets/ViewTargetCore.hpp"

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

void SceneCore::setSkybox(const std::shared_ptr<SkyboxCore>& skybox) {
  auto self = std::static_pointer_cast<SceneCore>(shared_from_this());
  if (skybox_ != nullptr) {
    skybox_->users().remove(self);
  }
  skybox_ = skybox;
  if (skybox_ != nullptr) {
    skybox_->users().add(self);
  }
  scene_->setSkybox(skybox_ == nullptr ? nullptr : skybox_->skybox());
}

Users<ViewTargetCore>& SceneCore::users() {
  return users_;
}

void SceneCore::destroyNative() {
  users_.forEach([](const std::shared_ptr<ViewTargetCore>& target) { target->setScene(nullptr); });
  setSkybox(nullptr);
  engine_->engine().destroy(scene_);
}

} // namespace margelo::nitro::filament
