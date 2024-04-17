//
// Created by Hanno Gödecke on 17.04.24.
//

#include "MaterialWrapper.h"

namespace margelo {
void MaterialWrapper::loadHybridMethods() {
  registerHybridMethod("createInstance", &MaterialWrapper::createInstance, this);
  registerHybridMethod("setDefaultParameter", &MaterialWrapper::setDefaultParameter, this);
  registerHybridMethod("getDefaultInstance", &MaterialWrapper::getDefaultInstance, this);
}
std::shared_ptr<MaterialInstanceWrapper> MaterialWrapper::createInstance() {
  return pointee()->createInstance();
}
std::shared_ptr<MaterialInstanceWrapper> MaterialWrapper::getDefaultInstance() {
  return pointee()->getDefaultInstance();
}
void MaterialWrapper::setDefaultParameter(std::string name, double value) {
  pointee()->setDefaultParameter(name, value);
}
} // namespace margelo