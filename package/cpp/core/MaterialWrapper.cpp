
#include "MaterialWrapper.h"

namespace margelo {
void MaterialWrapper::loadHybridMethods() {
  registerHybridMethod("createInstance", &MaterialWrapper::createInstance, this);
}

std::shared_ptr<MaterialInstanceWrapper> MaterialWrapper::createInstance() {
  MaterialInstance* materialInstance = _material->createInstance();
  // TODO: Who managed the memory of the material instance and cleans it up?
  return std::make_shared<MaterialInstanceWrapper>(materialInstance);
}
} // namespace margelo
