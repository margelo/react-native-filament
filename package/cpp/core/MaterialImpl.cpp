
#include "MaterialImpl.h"
#include <filament/Engine.h>

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

void MaterialImpl::setDefaultParameter(std::string name, double value) {
  std::unique_lock lock(_mutex);

  if (!_material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialWrapper::setDefaultParameter: Material does not have parameter \"" + name + "\"!");
  }

  _material->setDefaultParameter(name.c_str(), (float)value);
}

} // namespace margelo
