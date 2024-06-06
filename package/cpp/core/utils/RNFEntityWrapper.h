#pragma once

#include "jsi/RNFHybridObject.h"

#include <core/VertexEntity.h>
#include <filament/IndexBuffer.h>
#include <filament/VertexBuffer.h>
#include <utils/Entity.h>

namespace margelo {
using namespace utils;
using namespace filament;

class EntityWrapper : public HybridObject {
public:
  explicit EntityWrapper(Entity entity) : HybridObject("EntityWrapper"), _entity(entity) {}
  explicit EntityWrapper(const VertexEntity& vertexEntity)
      : HybridObject("EntityWrapper"), _entity(vertexEntity.entity), _vertexBuffer(vertexEntity.vertexBuffer),
        _indexBuffer(vertexEntity.indexBuffer) {}

  void loadHybridMethods() override;

  const Entity& getEntity() {
    return _entity;
  }

  int getId();

private:
  Entity _entity;
  std::shared_ptr<VertexBuffer> _vertexBuffer = nullptr;
  std::shared_ptr<IndexBuffer> _indexBuffer = nullptr;
};
} // namespace margelo
