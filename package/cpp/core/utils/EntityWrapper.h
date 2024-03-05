#pragma once

#include "jsi/HybridObject.h"

#include <utils/Entity.h>

namespace margelo {
using namespace utils;

class EntityWrapper : public HybridObject {
public:
  explicit EntityWrapper(Entity entity) : _entity(entity) {}

  void loadHybridMethods() override;

  const Entity& getEntity() {
    return _entity;
  }

private:
  Entity _entity;

private:
  const char* getName() override { return "EntityWrapper"; }
};
} // namespace margelo
