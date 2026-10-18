#include "SkyboxCore.hpp"

#include "SceneCore.hpp"
#include "utils/TextureMemory.hpp"

namespace margelo::nitro::filament {

SkyboxCore::SkyboxCore(std::shared_ptr<EngineCore> engine, std::array<float, 4> color)
    : Resource("Skybox"), engine_(std::move(engine)),
      skybox_(::filament::Skybox::Builder().color({color[0], color[1], color[2], color[3]}).build(engine_->engine())) {}

SkyboxCore::SkyboxCore(std::shared_ptr<EngineCore> engine, ::filament::Texture* environment)
    : Resource("Skybox"), engine_(std::move(engine)),
      skybox_(::filament::Skybox::Builder().environment(environment).build(engine_->engine())), environment_(environment),
      byteSize_(estimateTextureBytes(*environment)) {}

SkyboxCore::~SkyboxCore() {
  if (!isDestroyed()) {
    engine_->thread().post({.run = [engine = engine_, skybox = skybox_, environment = environment_] {
      engine->engine().destroy(skybox);
      if (environment != nullptr) {
        engine->engine().destroy(environment);
      }
    }});
  }
}

::filament::Skybox* SkyboxCore::skybox() const {
  return skybox_;
}

Users<SceneCore>& SkyboxCore::users() {
  return users_;
}

size_t SkyboxCore::byteSize() const {
  return byteSize_;
}

void SkyboxCore::destroyNative() {
  users_.forEach([](const std::shared_ptr<SceneCore>& scene) { scene->setSkybox(nullptr); });
  engine_->engine().destroy(skybox_);
  if (environment_ != nullptr) {
    engine_->engine().destroy(environment_);
  }
}

} // namespace margelo::nitro::filament
