#pragma once

#include "jsi/HybridObject.h"

#include <utils/Entity.h>

namespace margelo {
using namespace utils;

class EntityWrapper : public HybridObject {
public:
  explicit EntityWrapper(Entity entity) : entity(entity) {}
  ~EntityWrapper();

  void loadHybridMethods() override;

  Entity entity;
};
} // namespace margelo