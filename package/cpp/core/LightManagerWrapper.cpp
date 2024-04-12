//
// Created by Hanno Gödecke on 12.04.24.
//

#include "LightManagerWrapper.h"
#include "LightEnum.h"
#include "utils/Converter.h"

#include <utils/Entity.h>
#include <utils/EntityManager.h>

namespace margelo {

void LightManagerWrapper::loadHybridMethods() {
  registerHybridMethod("createLightEntity", &LightManagerWrapper::createLightEntity, this);
}

std::shared_ptr<EntityWrapper> LightManagerWrapper::createLightEntity(const std::string& lightTypeStr, std::optional<double> colorKelvin,
                                                                      std::optional<double> intensity,
                                                                      std::optional<std::vector<double>> direction,
                                                                      std::optional<std::vector<double>> position,
                                                                      std::optional<bool> castShadows, std::optional<double> falloffRadius,
                                                                      std::optional<std::vector<double>> spotLightCone) {
  std::unique_lock lock(_mutex);
  auto lightEntity = _engine->getEntityManager().create();

  // TODO(Marc): Fix enum converter
  LightManager::Type lightType;
  EnumMapper::convertJSUnionToEnum(lightTypeStr, &lightType);

  LightManager::Builder builder = LightManager::Builder(lightType);
  if (colorKelvin.has_value()) {
    builder.color(Color::cct(static_cast<float>(colorKelvin.value())));
  }
  if (intensity.has_value()) {
    builder.intensity(static_cast<float>(intensity.value()));
  }
  if (direction.has_value()) {
    math::float3 directionVec = Converter::VecToFloat3(direction.value());
    builder.direction(directionVec);
  }
  if (position.has_value()) {
    math::float3 positionVec = Converter::VecToFloat3(position.value());
    builder.position(positionVec);
  }
  if (castShadows.has_value()) {
    builder.castShadows(castShadows.value());
  }
  if (falloffRadius.has_value()) {
    builder.falloff(static_cast<float>(falloffRadius.value()));
  }
  if (spotLightCone.has_value()) {
    std::vector<double> spotLightConesVec = spotLightCone.value();
    if (spotLightConesVec.size() != 2) {
      throw std::invalid_argument("Spot light cones must have 2 values");
    }
    builder.spotLightCone(spotLightConesVec[0], spotLightConesVec[1]);
  }

  builder.build(*_engine, lightEntity);
  return std::make_shared<EntityWrapper>(lightEntity);
}

} // namespace margelo