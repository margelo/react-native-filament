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
  void release();

private: // JS API:
  std::shared_ptr<EntityWrapper> createLightEntity(const std::string& lightTypeStr, std::optional<double> colorKelvin,
                                                   std::optional<double> intensity, std::optional<std::vector<double>> direction,
                                                   std::optional<std::vector<double>> position, std::optional<bool> castShadows,
                                                   std::optional<double> falloffRadius, std::optional<std::vector<double>> spotLightCone);

  void destroy(std::shared_ptr<EntityWrapper> entityWrapper);
  void setPosition(std::shared_ptr<EntityWrapper> entityWrapper, std::vector<double> position);
  std::vector<double> getPosition(std::shared_ptr<EntityWrapper> entityWrapper);
  void setDirection(std::shared_ptr<EntityWrapper> entityWrapper, std::vector<double> direction);
  std::vector<double> getDirection(std::shared_ptr<EntityWrapper> entityWrapper);
  void setColor(std::shared_ptr<EntityWrapper> entityWrapper, std::vector<double> color);
  std::vector<double> getColor(std::shared_ptr<EntityWrapper> entityWrapper);
  void setIntensity(std::shared_ptr<EntityWrapper> entityWrapper, double intensity);
  double getIntensity(std::shared_ptr<EntityWrapper> entityWrapper);
  void setFalloff(std::shared_ptr<EntityWrapper> entityWrapper, double falloffRadius);
  double getFalloff(std::shared_ptr<EntityWrapper> entityWrapper);
  void setSpotLightCone(std::shared_ptr<EntityWrapper> entityWrapper, std::vector<double> spotLightCone);
  std::vector<double> getSpotLightCone(std::shared_ptr<EntityWrapper> entityWrapper);

private:
  LightManager::Instance getLightInstance(std::shared_ptr<EntityWrapper> entityWrapper);

private:
  std::mutex _mutex;
  std::shared_ptr<Engine> _engine; // Hold a reference to the engine
  LightManager& _lightManager;     // As long is the engine is alive, this light manager is alive
};

} // namespace margelo
