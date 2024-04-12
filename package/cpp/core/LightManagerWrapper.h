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
  explicit LightManagerWrapper(std::shared_ptr<Engine> engine) : HybridObject("LightManager"), _engine(engine) {}

  void loadHybridMethods() override;

private: // JS API:
  std::shared_ptr<EntityWrapper> createLightEntity(const std::string& lightTypeStr, std::optional<double> colorKelvin,
                                                   std::optional<double> intensity, std::optional<std::vector<double>> direction,
                                                   std::optional<std::vector<double>> position, std::optional<bool> castShadows,
                                                   std::optional<double> falloffRadius, std::optional<std::vector<double>> spotLightCone);

private:
  std::mutex _mutex;
  std::shared_ptr<Engine> _engine;
};

} // namespace margelo
