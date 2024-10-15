//
// Created by Hanno Gödecke on 18.07.24.
//
#include "RNFNameComponentManagerWrapper.h"

namespace margelo {

void NameComponentManagerWrapper::loadHybridMethods() {
  PointerHolder::loadHybridMethods();
  registerHybrids(
      this, [](nitro::Prototype& proto) { proto.registerHybridMethod("getEntityName", &NameComponentManagerWrapper::getEntityName); });
}

// TODO: This code is similar to EntityNameMap AnimatorWrapper::createEntityNameMap, consider refactoring
std::optional<std::string> NameComponentManagerWrapper::getEntityName(std::shared_ptr<EntityWrapper> entityWrapper) {
  if (!entityWrapper) {
    throw std::invalid_argument("EntityWrapper is null");
  }

  Entity entity = entityWrapper->getEntity();
  bool hasEntity = pointee()->hasComponent(entity);
  if (!hasEntity) {
    Logger::log(TAG, "Entity wasn't found in NameComponentManager");
    return std::nullopt;
  }

  NameComponentManager::Instance instance = pointee()->getInstance(entity);
  if (!instance || !instance.isValid()) {
    Logger::log(TAG, "Instance wasn't found in NameComponentManager");
    return std::nullopt;
  }
  return pointee()->getName(instance);
}
} // namespace margelo
