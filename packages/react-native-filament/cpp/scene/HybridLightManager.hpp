#pragma once

#include "HybridLightManagerSpec.hpp"
#include "engine/EngineCore.hpp"

#include <filament/LightManager.h>

#include <memory>

namespace margelo::nitro::filament {

class HybridLightManager final : public HybridLightManagerSpec {
public:
  explicit HybridLightManager(std::shared_ptr<EngineCore> engine);

  LightType getType(double entity) override;
  double getIntensity(double entity) override;
  void setIntensity(double entity, double intensity) override;
  std::tuple<double, double, double> getColor(double entity) override;
  void setColor(double entity, const std::tuple<double, double, double>& color) override;
  std::tuple<double, double, double> getPosition(double entity) override;
  void setPosition(double entity, const std::tuple<double, double, double>& position) override;
  std::tuple<double, double, double> getDirection(double entity) override;
  void setDirection(double entity, const std::tuple<double, double, double>& direction) override;
  double getFalloff(double entity) override;
  void setFalloff(double entity, double radius) override;
  std::tuple<double, double> getSpotLightCone(double entity) override;
  void setSpotLightCone(double entity, double innerRadians, double outerRadians) override;
  bool isShadowCaster(double entity) override;
  void setShadowCaster(double entity, bool castShadows) override;

private:
  struct Light {
    ::filament::LightManager& manager;
    ::filament::LightManager::Instance instance;
  };

  Light light(double entity, const char* method);

  std::shared_ptr<EngineCore> engine_;
};

} // namespace margelo::nitro::filament
