#pragma once

#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"

#include <filament/IndexBuffer.h>
#include <filament/VertexBuffer.h>
#include <utils/Entity.h>

#include <memory>

namespace margelo::nitro::filament {

class GeometryCore final : public Resource {
public:
  struct Buffers {
    ::filament::VertexBuffer* vertices;
    ::filament::IndexBuffer* indices;
  };

  GeometryCore(std::shared_ptr<EngineCore> engine, utils::Entity entity, Buffers buffers);
  ~GeometryCore() override;

  utils::Entity entity() const;

protected:
  void destroyNative() override;

private:
  static void destroyGeometry(EngineCore& engine, utils::Entity entity, Buffers buffers);

  std::shared_ptr<EngineCore> engine_;
  const utils::Entity entity_;
  const Buffers buffers_;
};

} // namespace margelo::nitro::filament
