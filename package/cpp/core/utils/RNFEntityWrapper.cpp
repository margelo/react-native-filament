#include "RNFEntityWrapper.h"

void margelo::EntityWrapper::loadHybridMethods() {
  HybridObject::loadHybridMethods();
  registerHybrids(this, [](nitro::Prototype& proto) { proto.registerHybridGetter("id", &EntityWrapper::getId); });
}

int margelo::EntityWrapper::getId() {
  return _entity.getId();
}
