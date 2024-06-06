
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
  auto instance = std::make_shared<MaterialInstanceWrapper>(materialInstance);
  _instances.push_back(instance);
  return instance;
}

void MaterialImpl::setDefaultFloatParameter(std::string name, double value) {
  std::unique_lock lock(_mutex);

  if (!_material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialWrapper::setDefaultFloatParameter: Material does not have parameter \"" + name + "\"!");
  }

  _material->setDefaultParameter(name.c_str(), (float)value);
}

    void MaterialImpl::setDefaultIntParameter(std::string name, int value) {
        std::unique_lock lock(_mutex);

        if (!_material->hasParameter(name.c_str())) {
            throw std::runtime_error("MaterialWrapper::setDefaultIntParameter: Material does not have parameter \"" + name + "\"!");
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

void MaterialImpl::setBaseColorSRGB(std::vector<double> rgba) {
  std::unique_lock lock(_mutex);
  if (rgba.size() != 4) {
    throw std::runtime_error("MaterialInstanceWrapper::setBaseColorSRGB: RGBA vector must have 4 elements!");
  }

  double r = rgba[0];
  double g = rgba[1];
  double b = rgba[2];
  double a = rgba[3];

  _material->setDefaultParameter("baseColorFactor", math::float4({r, g, b, a}));
}
std::string MaterialImpl::getName() {
  std::unique_lock lock(_mutex);
  return _material->getName();
}

void MaterialImpl::setDefaultMat3fParameter(std::string name, std::vector<double> value) {
std::unique_lock lock(_mutex);

  if (!_material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialWrapper::setDefaultMat3fParameter: Material does not have parameter \"" + name + "\"!");
  }

  if (value.size() != 9) {
    throw std::runtime_error("MaterialWrapper::setDefaultMat3fParameter: Value vector must have 9 elements!");
  }

  math::mat3f matrix = math::mat3f((float)value[0], (float)value[1], (float)value[2],
                                    (float)value[3], (float)value[4], (float)value[5],
                                    (float)value[6], (float)value[7], (float)value[8]);
  _material->setDefaultParameter(name.c_str(), matrix);
}

} // namespace margelo
