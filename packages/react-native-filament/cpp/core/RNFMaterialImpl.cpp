
#include "RNFMaterialImpl.h"
#include <filament/Engine.h>
#include <filament/TextureSampler.h>
#include <math/mat3.h>

namespace margelo {

std::shared_ptr<MaterialInstanceWrapper> MaterialImpl::createInstance() {
  std::unique_lock lock(_mutex);

  MaterialInstance* materialInstance = _material->createInstance();
  auto instance = std::make_shared<MaterialInstanceWrapper>(materialInstance);
  _instances.push_back(instance);
  return instance;
}

std::shared_ptr<MaterialInstanceWrapper> MaterialImpl::getDefaultInstance() {
  std::unique_lock lock(_mutex);

  MaterialInstance* materialInstance = _material->getDefaultInstance();
  // Note: the default material instance isn't added to the list of instances.
  // We only keep track of that list to destroy a material correctly (ie. all
  // its instances have to be destroyed first). However, the default instance
  // is not destroyable, so it can be ignored.
  return std::make_shared<MaterialInstanceWrapper>(materialInstance);
}

void MaterialImpl::setDefaultFloatParameter(std::string name, double value) {
  std::unique_lock lock(_mutex);

  if (!_material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialWrapper::setFloatParameter: Material does not have parameter \"" + name + "\"!");
  }

  _material->setDefaultParameter(name.c_str(), (float)value);
}

void MaterialImpl::setDefaultIntParameter(std::string name, int value) {
  std::unique_lock lock(_mutex);

  if (!_material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialWrapper::setIntParameter: Material does not have parameter \"" + name + "\"!");
  }

  _material->setDefaultParameter(name.c_str(), value);
}

void MaterialImpl::setDefaultTextureParameter(std::string name, Texture* texture, TextureSampler sampler) {
  std::unique_lock lock(_mutex);

  if (!_material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialWrapper::setDefaultTextureParameter: Material does not have parameter \"" + name + "\"!");
  }

  _material->setDefaultParameter(name.c_str(), texture, sampler);
}

void MaterialImpl::setDefaultFloat3Parameter(std::string name, std::vector<double> vector) {
  std::unique_lock lock(_mutex);
  if (vector.size() != 3) {
    throw std::runtime_error("setFloat3Parameter: RGB vector must have 3 elements!");
  }

  if (!_material->hasParameter(name.c_str())) {
    throw std::runtime_error("setFloat3Parameter: Material does not have parameter \"" + name + "\"!");
  }

  float x = vector[0];
  float y = vector[1];
  float z = vector[2];

  _material->setDefaultParameter(name.c_str(), math::float3({x, y, z}));
}

void MaterialImpl::setDefaultFloat4Parameter(std::string name, std::vector<double> vector) {
  std::unique_lock lock(_mutex);
  if (vector.size() != 4) {
    throw std::runtime_error("setFloat4Parameter: RGBA vector must have 4 elements!");
  }

  if (!_material->hasParameter(name.c_str())) {
    throw std::runtime_error("setFloat4Parameter: Material does not have parameter \"" + name + "\"!");
  }

  double r = vector[0];
  double g = vector[1];
  double b = vector[2];
  double a = vector[3];

  _material->setDefaultParameter(name.c_str(), math::float4({r, g, b, a}));
}
std::string MaterialImpl::getName() {
  std::unique_lock lock(_mutex);
  return _material->getName();
}

void MaterialImpl::setDefaultMat3fParameter(std::string name, std::vector<double> value) {
  std::unique_lock lock(_mutex);

  if (!_material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialWrapper::setMat3fParameter: Material does not have parameter \"" + name + "\"!");
  }

  if (value.size() != 9) {
    throw std::runtime_error("MaterialWrapper::setMat3fParameter: Value vector must have 9 elements!");
  }

  math::mat3f matrix = math::mat3f((float)value[0], (float)value[1], (float)value[2], (float)value[3], (float)value[4], (float)value[5],
                                   (float)value[6], (float)value[7], (float)value[8]);
  _material->setDefaultParameter(name.c_str(), matrix);
}

} // namespace margelo
