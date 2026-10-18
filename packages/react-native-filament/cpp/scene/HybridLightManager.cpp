#include "HybridLightManager.hpp"

#include "utils/ComponentChecks.hpp"
#include "utils/MatrixConversion.hpp"
#include "utils/ThreadChecks.hpp"

namespace margelo::nitro::filament {

namespace {

  std::tuple<double, double, double> toTuple(const ::filament::math::float3& value) {
    return {value.x, value.y, value.z};
  }

  LightType fromFilamentType(::filament::LightManager::Type type) {
    switch (type) {
      case ::filament::LightManager::Type::SUN:
        return LightType::SUN;
      case ::filament::LightManager::Type::DIRECTIONAL:
        return LightType::DIRECTIONAL;
      case ::filament::LightManager::Type::POINT:
        return LightType::POINT;
      case ::filament::LightManager::Type::FOCUSED_SPOT:
        return LightType::FOCUSED_SPOT;
      case ::filament::LightManager::Type::SPOT:
        return LightType::SPOT;
    }
  }

} // namespace

HybridLightManager::HybridLightManager(std::shared_ptr<EngineCore> engine) : HybridObject(TAG), engine_(std::move(engine)) {}

LightType HybridLightManager::getType(double entity) {
  auto [manager, instance] = light(entity, "LightManager.getType()");
  return fromFilamentType(manager.getType(instance));
}

double HybridLightManager::getIntensity(double entity) {
  auto [manager, instance] = light(entity, "LightManager.getIntensity()");
  return manager.getIntensity(instance);
}

void HybridLightManager::setIntensity(double entity, double intensity) {
  auto [manager, instance] = light(entity, "LightManager.setIntensity()");
  manager.setIntensity(instance, static_cast<float>(intensity));
}

std::tuple<double, double, double> HybridLightManager::getColor(double entity) {
  auto [manager, instance] = light(entity, "LightManager.getColor()");
  return toTuple(manager.getColor(instance));
}

void HybridLightManager::setColor(double entity, const std::tuple<double, double, double>& color) {
  auto [manager, instance] = light(entity, "LightManager.setColor()");
  manager.setColor(instance, toFloat3(color));
}

std::tuple<double, double, double> HybridLightManager::getPosition(double entity) {
  auto [manager, instance] = light(entity, "LightManager.getPosition()");
  return toTuple(manager.getPosition(instance));
}

void HybridLightManager::setPosition(double entity, const std::tuple<double, double, double>& position) {
  auto [manager, instance] = light(entity, "LightManager.setPosition()");
  manager.setPosition(instance, toFloat3(position));
}

std::tuple<double, double, double> HybridLightManager::getDirection(double entity) {
  auto [manager, instance] = light(entity, "LightManager.getDirection()");
  return toTuple(manager.getDirection(instance));
}

void HybridLightManager::setDirection(double entity, const std::tuple<double, double, double>& direction) {
  auto [manager, instance] = light(entity, "LightManager.setDirection()");
  manager.setDirection(instance, toFloat3(direction));
}

double HybridLightManager::getFalloff(double entity) {
  auto [manager, instance] = light(entity, "LightManager.getFalloff()");
  return manager.getFalloff(instance);
}

void HybridLightManager::setFalloff(double entity, double radius) {
  auto [manager, instance] = light(entity, "LightManager.setFalloff()");
  manager.setFalloff(instance, static_cast<float>(radius));
}

std::tuple<double, double> HybridLightManager::getSpotLightCone(double entity) {
  auto [manager, instance] = light(entity, "LightManager.getSpotLightCone()");
  return {manager.getSpotLightInnerCone(instance), manager.getSpotLightOuterCone(instance)};
}

void HybridLightManager::setSpotLightCone(double entity, double innerRadians, double outerRadians) {
  auto [manager, instance] = light(entity, "LightManager.setSpotLightCone()");
  manager.setSpotLightCone(instance, static_cast<float>(innerRadians), static_cast<float>(outerRadians));
}

bool HybridLightManager::isShadowCaster(double entity) {
  auto [manager, instance] = light(entity, "LightManager.isShadowCaster()");
  return manager.isShadowCaster(instance);
}

void HybridLightManager::setShadowCaster(double entity, bool castShadows) {
  auto [manager, instance] = light(entity, "LightManager.setShadowCaster()");
  manager.setShadowCaster(instance, castShadows);
}

HybridLightManager::Light HybridLightManager::light(double entity, const char* method) {
  requireRenderThread(engine_->thread(), method);
  ::filament::LightManager& manager = engine_->engine().getLightManager();
  return {manager, requireComponent(manager, entity, method, "light")};
}

} // namespace margelo::nitro::filament
