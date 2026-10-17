#include "LightCore.hpp"

#include "SceneCore.hpp"

#include <filament/Color.h>
#include <filament/LightManager.h>
#include <utils/EntityManager.h>

namespace margelo::nitro::filament {

std::shared_ptr<LightCore> LightCore::createDirectional(std::shared_ptr<EngineCore> engine, const DirectionalLightOptions& options) {
  auto [x, y, z] = options.direction.value_or(std::make_tuple(0.0, -1.0, 0.0));
  utils::Entity entity = utils::EntityManager::get().create();
  ::filament::LightManager::Builder(::filament::LightManager::Type::DIRECTIONAL)
      .color(::filament::Color::cct(static_cast<float>(options.colorKelvin.value_or(6500))))
      .intensity(static_cast<float>(options.intensityLux.value_or(10000)))
      .direction({static_cast<float>(x), static_cast<float>(y), static_cast<float>(z)})
      .castShadows(options.castShadows.value_or(true))
      .build(engine->engine(), entity);
  return std::make_shared<LightCore>(std::move(engine), entity);
}

LightCore::LightCore(std::shared_ptr<EngineCore> engine, utils::Entity entity)
    : Resource("Light"), engine_(std::move(engine)), entity_(entity) {}

LightCore::~LightCore() {
  if (!isDestroyed()) {
    engine_->thread().post({.run = [engine = engine_, entity = entity_] { destroyEntity(*engine, entity); }});
  }
}

utils::Entity LightCore::entity() const {
  return entity_;
}

void LightCore::destroyNative() {
  destroyEntity(*engine_, entity_);
}

void LightCore::destroyEntity(EngineCore& engine, utils::Entity entity) {
  engine.scenes().forEach([&](const std::shared_ptr<SceneCore>& scene) {
    if (!scene->isDestroyed()) {
      scene->scene().remove(entity);
    }
  });
  engine.engine().getLightManager().destroy(entity);
  utils::EntityManager::get().destroy(entity);
}

} // namespace margelo::nitro::filament
