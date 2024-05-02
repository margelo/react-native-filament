//
// Created by Hanno Gödecke on 30.04.24.
//

#include "RenderableManagerImpl.h"
#include <cmath>

#include <filament/IndexBuffer.h>
#include <filament/VertexBuffer.h>
#include <utils/EntityManager.h>

namespace margelo {
using namespace filament;
using namespace math;

std::shared_ptr<EntityWrapper>
RenderableManagerImpl::createDebugCubeWireframe(float halfExtentX, float halfExtentY, float halfExtentZ,
                                                std::optional<std::shared_ptr<MaterialWrapper>> materialWrapper,
                                                std::optional<double> colorHexCode) {
  // White: 0xFFFFFFFF
  // Note: When no material is provided the rendering backend will always draw a white line, we can't change that
  u_int32_t color = 0xFFFFFFFF;
  if (colorHexCode.has_value()) {
    color = static_cast<u_int32_t>(colorHexCode.value());
  }

  struct Vertex {
    float3 position;
    uint32_t color;
  };

  float3 minpt = {-halfExtentX, -halfExtentY, -halfExtentZ};
  float3 maxpt = {halfExtentX, halfExtentY, halfExtentZ};

  static const Vertex TRIANGLE_VERTICES[8] = {
      // -X face:
      {{minpt.x, minpt.y, minpt.z}, color},
      {{minpt.x, minpt.y, maxpt.z}, color},
      {{minpt.x, maxpt.y, minpt.z}, color},
      {{minpt.x, maxpt.y, maxpt.z}, color},
      // +X face:
      {{maxpt.x, minpt.y, minpt.z}, color},
      {{maxpt.x, minpt.y, maxpt.z}, color},
      {{maxpt.x, maxpt.y, minpt.z}, color},
      {{maxpt.x, maxpt.y, maxpt.z}, color},
  };

  static constexpr uint16_t TRIANGLE_INDICES[24] = {
      // Generate 4 lines around face at -X:
      0,
      1,
      1,
      3,
      3,
      2,
      2,
      0,
      // Generate 4 lines around face at +X:
      4,
      5,
      5,
      7,
      7,
      6,
      6,
      4,
      // Generate 2 horizontal lines at -Z:
      0,
      4,
      2,
      6,
      // Generate 2 horizontal lines at +Z:
      1,
      5,
      3,
      7,
  };

  auto vertexBuffer = VertexBuffer::Builder()
                          .vertexCount(8)
                          .bufferCount(1)
                          .attribute(VertexAttribute::POSITION, 0, VertexBuffer::AttributeType::FLOAT3, 0, sizeof(Vertex))
                          .attribute(VertexAttribute::COLOR, 0, VertexBuffer::AttributeType::UBYTE4, sizeof(float3), sizeof(Vertex))
                          .normalized(VertexAttribute::COLOR)
                          .build(*_engine);
  vertexBuffer->setBufferAt(*_engine, 0,
                            VertexBuffer::BufferDescriptor(TRIANGLE_VERTICES, vertexBuffer->getVertexCount() * sizeof(Vertex), nullptr));

  auto indexBuffer = IndexBuffer::Builder().indexCount(24).bufferType(IndexBuffer::IndexType::USHORT).build(*_engine);
  indexBuffer->setBuffer(*_engine,
                         IndexBuffer::BufferDescriptor(TRIANGLE_INDICES, indexBuffer->getIndexCount() * sizeof(uint16_t), nullptr));

  // Creating a renderable entity.
  Entity wireframeEntity = EntityManager::get().create();

  // Building the renderable.
  RenderableManager::Builder builder = RenderableManager::Builder(1);
  builder.boundingBox({.center = {-1, -1, -1}, .halfExtent = {1, 1, 1}})
      .culling(false)
      .castShadows(false)
      .receiveShadows(false)
      .geometry(0, RenderableManager::PrimitiveType::LINES, vertexBuffer, indexBuffer);

  if (materialWrapper.has_value()) {
    auto materialInstanceWrapper = materialWrapper.value()->getDefaultInstance();
    MaterialInstance* instance = materialInstanceWrapper->getMaterialInstance();
    builder.material(0, instance);
  }

  RenderableManager::Builder::Result result = builder.build(*_engine, wireframeEntity);
  if (result != RenderableManager::Builder::Result::Success) {
    throw std::runtime_error("Failed to build wireframe renderable");
  }

  return std::make_shared<EntityWrapper>(wireframeEntity);
}
} // namespace margelo