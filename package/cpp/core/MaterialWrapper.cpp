
#include "MaterialWrapper.h"

namespace margelo {
void MaterialWrapper::loadHybridMethods() {
  registerHybridMethod("createInstance", &MaterialWrapper::createInstance, this);
  registerHybridMethod("setDefaultParameter", &MaterialWrapper::setDefaultParameter, this);
  registerHybridMethod("getDefaultInstance", &MaterialWrapper::getDefaultInstance, this);
}

std::shared_ptr<MaterialInstanceWrapper> MaterialWrapper::createInstance() {
  MaterialInstance* materialInstance = _material->createInstance();
  // TODO: Who managed the memory of the material instance and cleans it up?
  auto instance = std::make_shared<MaterialInstanceWrapper>(materialInstance);
  _instances.push_back(instance);
  return instance;
}

std::shared_ptr<MaterialInstanceWrapper> MaterialWrapper::getDefaultInstance() {
  MaterialInstance* materialInstance = _material->getDefaultInstance();
  auto instance = std::make_shared<MaterialInstanceWrapper>(materialInstance);
  _instances.push_back(instance);
  return instance;
}

void MaterialWrapper::setDefaultParameter(std::string name, double value) {
  if (!_material->hasParameter(name.c_str())) {
    throw std::runtime_error("MaterialWrapper::setDefaultParameter: Material does not have parameter \"" + name + "\"!");
  }

  _material->setDefaultParameter(name.c_str(), (float)value);
}

} // namespace margelo
