//
// Created by Hanno Gödecke on 12.04.24.
//

#pragma once

#include "core/utils/EntityWrapper.h"
#include "jsi/HybridObject.h"
#include <filament/Engine.h>
#include <filament/LightManager.h>

namespace margelo {

using namespace filament;

class LightManagerWrapper : public HybridObject {
public:
  explicit LightManagerWrapper(std::shared_ptr<Engine> engine)
      : HybridObject("LightManager"), _engine(engine), _lightManager(_engine->getLightManager()) {}

  void loadHybridMethods() override;

private: // JS API:
  std::shared_ptr<EntityWrapper> createLightEntity(const std::string& lightTypeStr, std::optional<double> colorKelvin,
                                                   std::optional<double> intensity, std::optional<std::vector<double>> direction,
                                                   std::optional<std::vector<double>> position, std::optional<bool> castShadows,
                                                   std::optional<double> falloffRadius, std::optional<std::vector<double>> spotLightCone);

  void destroy(const std::shared_ptr<EntityWrapper>& entityWrapper);
  void setPosition(const std::shared_ptr<EntityWrapper>& entityWrapper, const std::vector<double>& position);
  std::vector<double> getPosition(const std::shared_ptr<EntityWrapper>& entityWrapper);
  void setDirection(const std::shared_ptr<EntityWrapper>& entityWrapper, const std::vector<double>& direction);
  std::vector<double> getDirection(const std::shared_ptr<EntityWrapper>& entityWrapper);
  void setColor(const std::shared_ptr<EntityWrapper>& entityWrapper, std::vector<double> color);
  std::vector<double> getColor(const std::shared_ptr<EntityWrapper>& entityWrapper);
  void setIntensity(const std::shared_ptr<EntityWrapper>& entityWrapper, double intensity);
  double getIntensity(const std::shared_ptr<EntityWrapper>& entityWrapper);
  void setFalloff(const std::shared_ptr<EntityWrapper>& entityWrapper, double falloffRadius);
  double getFalloff(const std::shared_ptr<EntityWrapper>& entityWrapper);
  void setSpotLightCone(const std::shared_ptr<EntityWrapper>& entityWrapper, const std::vector<double>& spotLightCone);
  std::vector<double> getSpotLightCone(const std::shared_ptr<EntityWrapper>& entityWrapper);

private:
  LightManager::Instance getLightInstance(const std::shared_ptr<EntityWrapper>& entityWrapper);

private:
  std::mutex _mutex;
  std::shared_ptr<Engine> _engine; // Hold a reference to the engine
  LightManager& _lightManager;     // As long is the engine is alive, this light manager is alive
};

} // namespace margelo
