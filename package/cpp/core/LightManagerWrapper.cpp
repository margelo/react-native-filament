//
// Created by Hanno Gödecke on 12.04.24.
//

#include "LightManagerWrapper.h"
#include "LightEnum.h"
#include "References.h"
#include "utils/Converter.h"

#include <utils/Entity.h>
#include <utils/EntityManager.h>

namespace margelo {

void LightManagerWrapper::loadHybridMethods() {
  registerHybridMethod("createLightEntity", &LightManagerWrapper::createLightEntity, this);
  registerHybridMethod("destroy", &LightManagerWrapper::destroy, this);
  registerHybridMethod("setPosition", &LightManagerWrapper::setPosition, this);
  registerHybridMethod("getPosition", &LightManagerWrapper::getPosition, this);
  registerHybridMethod("setDirection", &LightManagerWrapper::setDirection, this);
  registerHybridMethod("getDirection", &LightManagerWrapper::getDirection, this);
  registerHybridMethod("setColor", &LightManagerWrapper::setColor, this);
  registerHybridMethod("getColor", &LightManagerWrapper::getColor, this);
  registerHybridMethod("setIntensity", &LightManagerWrapper::setIntensity, this);
  registerHybridMethod("getIntensity", &LightManagerWrapper::getIntensity, this);
  registerHybridMethod("setFalloff", &LightManagerWrapper::setFalloff, this);
  registerHybridMethod("getFalloff", &LightManagerWrapper::getFalloff, this);
  registerHybridMethod("setSpotLightCone", &LightManagerWrapper::setSpotLightCone, this);
  registerHybridMethod("getSpotLightCone", &LightManagerWrapper::getSpotLightCone, this);
}

std::shared_ptr<EntityWrapper> LightManagerWrapper::createLightEntity(const std::string& lightTypeStr, std::optional<double> colorKelvin,
                                                                      std::optional<double> intensity,
                                                                      std::optional<std::vector<double>> direction,
                                                                      std::optional<std::vector<double>> position,
                                                                      std::optional<bool> castShadows, std::optional<double> falloffRadius,
                                                                      std::optional<std::vector<double>> spotLightCone) {
  std::unique_lock lock(_mutex);
  EntityManager& entityManager = pointee()->getEntityManager();
  auto lightEntity = entityManager.create();

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

  builder.build(*pointee(), lightEntity);
  return std::make_shared<EntityWrapper>(lightEntity);
}

void LightManagerWrapper::destroy(std::shared_ptr<EntityWrapper> entityWrapper) {
  std::unique_lock lock(_mutex);
  _lightManager.destroy(entityWrapper->getEntity());
}

LightManager::Instance LightManagerWrapper::getLightInstance(std::shared_ptr<EntityWrapper> entityWrapper) {
  Entity entity = entityWrapper->getEntity();
  LightManager::Instance lightInstance = _lightManager.getInstance(entity);
  if (!lightInstance.isValid()) {
    throw std::invalid_argument("Entity is not a light!");
  }

  return lightInstance;
}

void LightManagerWrapper::setPosition(std::shared_ptr<EntityWrapper> entityWrapper, std::vector<double> position) {
  std::unique_lock lock(_mutex);
  LightManager::Instance lightInstance = getLightInstance(entityWrapper);

  math::float3 positionVec = Converter::VecToFloat3(position);
  _lightManager.setPosition(lightInstance, positionVec);
}

std::vector<double> LightManagerWrapper::getPosition(std::shared_ptr<EntityWrapper> entityWrapper) {
  LightManager::Instance lightInstance = getLightInstance(entityWrapper);

  math::float3 position = _lightManager.getPosition(lightInstance);
  return Converter::Float3ToVec(position);
}
void LightManagerWrapper::setDirection(std::shared_ptr<EntityWrapper> entityWrapper, std::vector<double> direction) {
  std::unique_lock lock(_mutex);
  LightManager::Instance lightInstance = getLightInstance(entityWrapper);

  math::float3 directionVec = Converter::VecToFloat3(direction);
  _lightManager.setDirection(lightInstance, directionVec);
}
std::vector<double> LightManagerWrapper::getDirection(std::shared_ptr<EntityWrapper> entityWrapper) {
  LightManager::Instance lightInstance = getLightInstance(entityWrapper);

  math::float3 direction = _lightManager.getDirection(lightInstance);
  return Converter::Float3ToVec(direction);
}
void LightManagerWrapper::setColor(std::shared_ptr<EntityWrapper> entityWrapper, std::vector<double> color) {
  std::unique_lock lock(_mutex);
  LightManager::Instance lightInstance = getLightInstance(entityWrapper);

  math::float3 colorVec = Converter::VecToFloat3(color);
  _lightManager.setColor(lightInstance, colorVec);
}
std::vector<double> LightManagerWrapper::getColor(std::shared_ptr<EntityWrapper> entityWrapper) {
  LightManager::Instance lightInstance = getLightInstance(entityWrapper);

  math::float3 color = _lightManager.getColor(lightInstance);
  return Converter::Float3ToVec(color);
}
void LightManagerWrapper::setIntensity(std::shared_ptr<EntityWrapper> entityWrapper, double intensity) {
  std::unique_lock lock(_mutex);
  LightManager::Instance lightInstance = getLightInstance(entityWrapper);

  _lightManager.setIntensity(lightInstance, static_cast<float>(intensity));
}
double LightManagerWrapper::getIntensity(std::shared_ptr<EntityWrapper> entityWrapper) {
  LightManager::Instance lightInstance = getLightInstance(entityWrapper);

  return _lightManager.getIntensity(lightInstance);
}
void LightManagerWrapper::setFalloff(std::shared_ptr<EntityWrapper> entityWrapper, double falloffRadius) {
  std::unique_lock lock(_mutex);
  LightManager::Instance lightInstance = getLightInstance(entityWrapper);

  _lightManager.setFalloff(lightInstance, static_cast<float>(falloffRadius));
}
double LightManagerWrapper::getFalloff(std::shared_ptr<EntityWrapper> entityWrapper) {
  LightManager::Instance lightInstance = getLightInstance(entityWrapper);

  return static_cast<double>(_lightManager.getFalloff(lightInstance));
}
void LightManagerWrapper::setSpotLightCone(std::shared_ptr<EntityWrapper> entityWrapper, std::vector<double> spotLightCone) {
  std::unique_lock lock(_mutex);
  LightManager::Instance lightInstance = getLightInstance(entityWrapper);

  if (spotLightCone.size() != 2) {
    throw std::invalid_argument("Spot light cones must have 2 values");
  }

  _lightManager.setSpotLightCone(lightInstance, spotLightCone[0], spotLightCone[1]);
}
std::vector<double> LightManagerWrapper::getSpotLightCone(std::shared_ptr<EntityWrapper> entityWrapper) {
  LightManager::Instance lightInstance = getLightInstance(entityWrapper);

  float innerCone = _lightManager.getSpotLightInnerCone(lightInstance);
  float outerCone = _lightManager.getSpotLightOuterCone(lightInstance);
  return {static_cast<double>(innerCone), static_cast<double>(outerCone)};
}

} // namespace margelo