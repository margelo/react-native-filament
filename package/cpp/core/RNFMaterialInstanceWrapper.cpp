//
// Created by Hanno Gödecke on 20.03.24.
//

#include "RNFMaterialInstanceWrapper.h"
#include "RNFCullingModeEnum.h"
#include "RNFTransparencyModeEnum.h"
#include <filament/Material.h>
#include <math/mat3.h>

namespace margelo {
void MaterialInstanceWrapper::loadHybridMethods() {
  registerHybridMethod("setCullingMode", &MaterialInstanceWrapper::setCullingMode, this);
  registerHybridMethod("setTransparencyMode", &MaterialInstanceWrapper::setTransparencyMode, this);
  registerHybridMethod("changeAlpha", &MaterialInstanceWrapper::changeAlpha, this);
  registerHybridMethod("setFloat4Parameter", &MaterialInstanceWrapper::setFloatParameter, this);
  registerHybridMethod("setIntParameter", &MaterialInstanceWrapper::setIntParameter, this);
  registerHybridMethod("setFloat3Parameter", &MaterialInstanceWrapper::setFloat3Parameter, this);
  registerHybridMethod("setFloat4Parameter", &MaterialInstanceWrapper::setFloat4Parameter, this);
  registerHybridMethod("setMat3fParameter", &MaterialInstanceWrapper::setMat3fParameter, this);
  registerHybridMethod("getFloatParameter", &MaterialInstanceWrapper::getFloatParameter, this);
  registerHybridMethod("getIntParameter", &MaterialInstanceWrapper::getIntParameter, this);
  registerHybridMethod("getFloat3Parameter", &MaterialInstanceWrapper::getFloat3Parameter, this);
  registerHybridMethod("getFloat4Parameter", &MaterialInstanceWrapper::getFloat4Parameter, this);
  registerHybridMethod("getMat3fParameter", &MaterialInstanceWrapper::getMat3fParameter, this);
  registerHybridGetter("getName", &MaterialInstanceWrapper::getName, this);
}

void MaterialInstanceWrapper::setCullingMode(std::string mode) {
  std::unique_lock lock(_mutex);

  backend::CullingMode cullingMode;
  EnumMapper::convertJSUnionToEnum(mode, &cullingMode);
  _materialInstance->setCullingMode(cullingMode);
}

void MaterialInstanceWrapper::setTransparencyMode(std::string mode) {
  std::unique_lock lock(_mutex);

  TransparencyMode transparencyMode;
  EnumMapper::convertJSUnionToEnum(mode, &transparencyMode);
  _materialInstance->setTransparencyMode(transparencyMode);
}

void MaterialInstanceWrapper::changeAlpha(MaterialInstance* materialInstance, double alpha) {
  // Clip alpha to 0-1
  alpha = std::clamp(alpha, 0.0, 1.0);

  // Customer's default:
  materialInstance->setTransparencyMode(TransparencyMode::TWO_PASSES_ONE_SIDE);

  math::float4 rgba = materialInstance->getParameter<math::float4>("baseColorFactor");
  materialInstance->setParameter("baseColorFactor", math::float4({rgba.r, rgba.g, rgba.b, alpha}));
}

void MaterialInstanceWrapper::changeAlpha(double alpha) {
  std::unique_lock lock(_mutex);

  changeAlpha(_materialInstance, alpha);
}

void MaterialInstanceWrapper::setFloatParameter(std::string name, double value) {
  std::unique_lock lock(_mutex);

  const Material* material = _materialInstance->getMaterial();
  if (!material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialInstanceWrapper::setFloatParameter: Material does not have parameter \"" + name + "\"!");
  }

  _materialInstance->setParameter(name.c_str(), (float)value);
}

void MaterialInstanceWrapper::setIntParameter(std::string name, int value) {
  std::unique_lock lock(_mutex);

  const Material* material = _materialInstance->getMaterial();
  if (!material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialInstanceWrapper::setIntParameter: Material does not have parameter \"" + name + "\"!");
  }

  _materialInstance->setParameter(name.c_str(), value);
}

void MaterialInstanceWrapper::setFloat3Parameter(std::string name, std::vector<double> vector) {
  std::unique_lock lock(_mutex);
  if (vector.size() != 3) {
    throw std::runtime_error("MaterialInstanceWrapper::setFloat3Parameter: RGB vector must have 3 elements!");
  }

  const Material* material = _materialInstance->getMaterial();
  if (!material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialInstanceWrapper::setFloat3Parameter: Material does not have parameter \"" + name + "\"!");
  }

  float x = vector[0];
  float y = vector[1];
  float z = vector[2];

  _materialInstance->setParameter(name.c_str(), math::float3({x, y, z}));
}

void MaterialInstanceWrapper::setFloat4Parameter(std::string name, std::vector<double> vector) {
  std::unique_lock lock(_mutex);
  if (vector.size() != 4) {
    throw std::runtime_error("MaterialInstanceWrapper::setFloat4Parameter: RGBA vector must have 4 elements!");
  }

  const Material* material = _materialInstance->getMaterial();
  if (!material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialInstanceWrapper::setFloat4Parameter: Material does not have parameter \"" + name + "\"!");
  }

  double r = vector[0];
  double g = vector[1];
  double b = vector[2];
  double a = vector[3];

  _materialInstance->setParameter(name.c_str(), math::float4({r, g, b, a}));
}

void MaterialInstanceWrapper::setMat3fParameter(std::string name, std::vector<double> value) {
  std::unique_lock lock(_mutex);

  const Material* material = _materialInstance->getMaterial();
  if (!material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialInstanceWrapper::setMat3fParameter: Material does not have parameter \"" + name + "\"!");
  }

  if (value.size() != 9) {
    throw std::runtime_error("MaterialInstanceWrapper::setMat3fParameter: Value vector must have 9 elements!");
  }

  math::mat3f matrix = math::mat3f((float)value[0], (float)value[1], (float)value[2], (float)value[3], (float)value[4], (float)value[5],
                                   (float)value[6], (float)value[7], (float)value[8]);
  _materialInstance->setParameter(name.c_str(), matrix);
}

std::string MaterialInstanceWrapper::getName() {
  std::unique_lock lock(_mutex);

  return _materialInstance->getName();
}

double MaterialInstanceWrapper::getFloatParameter(std::string name) {
  const Material* material = _materialInstance->getMaterial();
  if (!material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialInstanceWrapper::getFloatParameter: Material does not have parameter \"" + name + "\"!");
  }

  return _materialInstance->getParameter<float>(name.c_str());
}

int MaterialInstanceWrapper::getIntParameter(std::string name) {
  const Material* material = _materialInstance->getMaterial();
  if (!material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialInstanceWrapper::getIntParameter: Material does not have parameter \"" + name + "\"!");
  }

  return _materialInstance->getParameter<int>(name.c_str());
}

std::vector<double> MaterialInstanceWrapper::getFloat3Parameter(std::string name) {
  const Material* material = _materialInstance->getMaterial();
  if (!material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialInstanceWrapper::getFloat3Parameter: Material does not have parameter \"" + name + "\"!");
  }

  math::float3 vector = _materialInstance->getParameter<math::float3>(name.c_str());
  return {vector.x, vector.y, vector.z};
}

std::vector<double> MaterialInstanceWrapper::getFloat4Parameter(std::string name) {
  const Material* material = _materialInstance->getMaterial();
  if (!material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialInstanceWrapper::getFloat4Parameter: Material does not have parameter \"" + name + "\"!");
  }

  math::float4 vector = _materialInstance->getParameter<math::float4>(name.c_str());
  return {vector.r, vector.g, vector.b, vector.a};
}

std::vector<double> MaterialInstanceWrapper::getMat3fParameter(std::string name) {
  const Material* material = _materialInstance->getMaterial();
  if (!material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialInstanceWrapper::getMat3fParameter: Material does not have parameter \"" + name + "\"!");
  }

  math::mat3f matrix = _materialInstance->getParameter<math::mat3f>(name.c_str());
  const float* matrixArray = matrix.asArray();
  return {matrixArray[0], matrixArray[1], matrixArray[2], matrixArray[3], matrixArray[4],
          matrixArray[5], matrixArray[6], matrixArray[7], matrixArray[8]};
}

} // namespace margelo
