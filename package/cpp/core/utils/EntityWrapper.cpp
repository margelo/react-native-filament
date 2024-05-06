#include "EntityWrapper.h"

void margelo::EntityWrapper::loadHybridMethods() {
  registerHybridGetter("id", &EntityWrapper::getId, this);
}

int margelo::EntityWrapper::getId() {
  return _entity.getId();
}
