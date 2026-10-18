#include "LightCore.hpp"

#include "SceneCore.hpp"

#include <filament/Color.h>
#include <filament/LightManager.h>
#include <utils/EntityManager.h>

#include <cmath>

namespace margelo::nitro::filament {

namespace {

  using Builder = ::filament::LightManager::Builder;
  using FilamentType = ::filament::LightManager::Type;

  ::filament::math::float3 toVector(const std::optional<std::tuple<double, double, double>>& value,
                                    std::tuple<double, double, double> fallback) {
    auto [x, y, z] = value.value_or(fallback);
    return {static_cast<float>(x), static_cast<float>(y), static_cast<float>(z)};
  }

  ::filament::LinearColor colorOf(const std::optional<double>& kelvin) {
    return ::filament::Color::cct(static_cast<float>(kelvin.value_or(6500)));
  }

  std::shared_ptr<LightCore> build(std::shared_ptr<EngineCore> engine, Builder& builder, LightType type) {
    utils::Entity entity = utils::EntityManager::get().create();
    builder.build(engine->engine(), entity);
    return std::make_shared<LightCore>(std::move(engine), entity, type);
  }

} // namespace

std::shared_ptr<LightCore> LightCore::createDirectional(std::shared_ptr<EngineCore> engine, const DirectionalLightOptions& options) {
  Builder builder(FilamentType::DIRECTIONAL);
  builder.color(colorOf(options.colorKelvin))
      .intensity(static_cast<float>(options.intensityLux.value_or(10000)))
      .direction(toVector(options.direction, {0.0, -1.0, 0.0}))
      .castShadows(options.castShadows.value_or(true));
  return build(std::move(engine), builder, LightType::DIRECTIONAL);
}

std::shared_ptr<LightCore> LightCore::createSun(std::shared_ptr<EngineCore> engine, const SunLightOptions& options) {
  Builder builder(FilamentType::SUN);
  builder.color(colorOf(options.colorKelvin))
      .intensity(static_cast<float>(options.intensityLux.value_or(100000)))
      .direction(toVector(options.direction, {0.0, -1.0, 0.0}))
      .castShadows(options.castShadows.value_or(true))
      .sunAngularRadius(static_cast<float>(options.angularRadiusDegrees.value_or(0.545)))
      .sunHaloSize(static_cast<float>(options.haloSize.value_or(10)))
      .sunHaloFalloff(static_cast<float>(options.haloFalloff.value_or(80)));
  return build(std::move(engine), builder, LightType::SUN);
}

std::shared_ptr<LightCore> LightCore::createPoint(std::shared_ptr<EngineCore> engine, const PointLightOptions& options) {
  Builder builder(FilamentType::POINT);
  builder.color(colorOf(options.colorKelvin))
      .intensity(static_cast<float>(options.intensityLumens.value_or(1000)))
      .position(toVector(options.position, {0.0, 0.0, 0.0}))
      .falloff(static_cast<float>(options.falloffRadius.value_or(1)))
      .castShadows(options.castShadows.value_or(false));
  return build(std::move(engine), builder, LightType::POINT);
}

std::shared_ptr<LightCore> LightCore::createSpot(std::shared_ptr<EngineCore> engine, const SpotLightOptions& options, bool focused) {
  Builder builder(focused ? FilamentType::FOCUSED_SPOT : FilamentType::SPOT);
  builder.color(colorOf(options.colorKelvin))
      .intensity(static_cast<float>(options.intensityLumens.value_or(1000)))
      .position(toVector(options.position, {0.0, 0.0, 0.0}))
      .direction(toVector(options.direction, {0.0, -1.0, 0.0}))
      .falloff(static_cast<float>(options.falloffRadius.value_or(1)))
      .spotLightCone(static_cast<float>(options.innerConeRadians.value_or(M_PI / 8)),
                     static_cast<float>(options.outerConeRadians.value_or(M_PI / 4)))
      .castShadows(options.castShadows.value_or(false));
  return build(std::move(engine), builder, focused ? LightType::FOCUSED_SPOT : LightType::SPOT);
}

LightCore::LightCore(std::shared_ptr<EngineCore> engine, utils::Entity entity, LightType type)
    : Resource("Light"), engine_(std::move(engine)), entity_(entity), type_(type) {}

LightCore::~LightCore() {
  if (!isDestroyed()) {
    engine_->thread().post({.run = [engine = engine_, entity = entity_] { destroyEntity(*engine, entity); }});
  }
}

utils::Entity LightCore::entity() const {
  return entity_;
}

LightType LightCore::type() const {
  return type_;
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
