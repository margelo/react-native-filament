#include "SkyboxCore.hpp"

#include "SceneCore.hpp"

namespace margelo::nitro::filament {

SkyboxCore::SkyboxCore(std::shared_ptr<EngineCore> engine, std::array<float, 4> color)
    : Resource("Skybox"), engine_(std::move(engine)),
      skybox_(::filament::Skybox::Builder().color({color[0], color[1], color[2], color[3]}).build(engine_->engine())) {}

SkyboxCore::~SkyboxCore() {
  if (!isDestroyed()) {
    engine_->thread().post({.run = [engine = engine_, skybox = skybox_] { engine->engine().destroy(skybox); }});
  }
}

::filament::Skybox* SkyboxCore::skybox() const {
  return skybox_;
}

Users<SceneCore>& SkyboxCore::users() {
  return users_;
}

void SkyboxCore::destroyNative() {
  users_.forEach([](const std::shared_ptr<SceneCore>& scene) { scene->setSkybox(nullptr); });
  engine_->engine().destroy(skybox_);
}

} // namespace margelo::nitro::filament
