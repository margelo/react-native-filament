#include "GeometryBuilders.hpp"

#include "OwnedBuffer.hpp"
#include "utils/MatrixConversion.hpp"

#include <filament/Box.h>
#include <filament/RenderableManager.h>
#include <math/mat3.h>
#include <math/norm.h>
#include <utils/EntityManager.h>

#include <algorithm>
#include <array>
#include <cmath>
#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

namespace {

  using ::filament::IndexBuffer;
  using ::filament::RenderableManager;
  using ::filament::VertexBuffer;
  using ::filament::math::float2;
  using ::filament::math::float3;
  using ::filament::math::float4;
  using ::filament::math::mat3f;
  using ::filament::math::short4;
  using ::filament::math::ubyte4;
  using Attribute = ::filament::VertexAttribute;
  using AttributeType = VertexBuffer::AttributeType;
  using Primitive = RenderableManager::PrimitiveType;

  constexpr std::array<float4, 3> kFullScreenTriangle{{{-1, -1, 1, 1}, {3, -1, 1, 1}, {-1, 3, 1, 1}}};
  constexpr std::array<uint16_t, 3> kFullScreenTriangleIndices{0, 1, 2};

  IndexBuffer* buildIndices(::filament::Engine& engine, std::vector<uint16_t> indices) {
    IndexBuffer* buffer =
        IndexBuffer::Builder().indexCount(static_cast<uint32_t>(indices.size())).bufferType(IndexBuffer::IndexType::USHORT).build(engine);
    buffer->setBuffer(engine, ownedBuffer(std::move(indices)));
    return buffer;
  }

  ubyte4 toByteColor(const std::tuple<double, double, double, double>& color) {
    auto channel = [](double value) { return static_cast<uint8_t>(std::lround(std::clamp(value, 0.0, 1.0) * 255)); };
    auto [r, g, b, a] = color;
    return {channel(r), channel(g), channel(b), channel(a)};
  }

  std::shared_ptr<GeometryCore> assign(std::shared_ptr<EngineCore> engine, utils::Entity entity, GeometryCore::Buffers buffers,
                                       AssignedMaterial material) {
    engine->materialAssignments().assign(engine->engine(), entity, 0, &material.instance, std::move(material.owner));
    return std::make_shared<GeometryCore>(std::move(engine), entity, buffers);
  }

} // namespace

std::shared_ptr<GeometryCore> buildPlane(std::shared_ptr<EngineCore> engine, const PlaneOptions& options, AssignedMaterial material) {
  if (!(options.width > 0) || !(options.depth > 0)) {
    throw std::invalid_argument("Engine.createPlane() needs a positive width and depth, got " + std::to_string(options.width) + " x " +
                                std::to_string(options.depth) + ".");
  }
  ::filament::Engine& filament = engine->engine();
  float halfX = static_cast<float>(options.width) / 2;
  float halfZ = static_cast<float>(options.depth) / 2;
  // Filament treats an AABB with a zero extent as empty, which drops the plane from shadow receivers.
  float halfY = std::max(halfX, halfZ) * 1e-4f;
  short4 tangentFrame =
      ::filament::math::packSnorm16(mat3f::packTangentFrame(mat3f{float3{1, 0, 0}, float3{0, 0, 1}, float3{0, 1, 0}}).xyzw);

  VertexBuffer* vertices = VertexBuffer::Builder()
                               .vertexCount(4)
                               .bufferCount(3)
                               .attribute(Attribute::POSITION, 0, AttributeType::FLOAT3)
                               .attribute(Attribute::TANGENTS, 1, AttributeType::SHORT4)
                               .normalized(Attribute::TANGENTS)
                               .attribute(Attribute::UV0, 2, AttributeType::FLOAT2)
                               .build(filament);
  vertices->setBufferAt(filament, 0,
                        ownedBuffer(std::vector<float3>{{-halfX, 0, -halfZ}, {-halfX, 0, halfZ}, {halfX, 0, halfZ}, {halfX, 0, -halfZ}}));
  vertices->setBufferAt(filament, 1, ownedBuffer(std::vector<short4>(4, tangentFrame)));
  vertices->setBufferAt(filament, 2, ownedBuffer(std::vector<float2>{{0, 0}, {0, 1}, {1, 1}, {1, 0}}));
  IndexBuffer* indices = buildIndices(filament, {0, 1, 2, 2, 3, 0});

  utils::Entity entity = utils::EntityManager::get().create();
  RenderableManager::Builder(1)
      .boundingBox({{0, 0, 0}, {halfX, halfY, halfZ}})
      .geometry(0, Primitive::TRIANGLES, vertices, indices)
      .castShadows(options.castShadows.value_or(false))
      .receiveShadows(options.receiveShadows.value_or(true))
      .build(filament, entity);
  return assign(std::move(engine), entity, {vertices, indices}, std::move(material));
}

std::shared_ptr<GeometryCore> buildBackground(std::shared_ptr<EngineCore> engine, AssignedMaterial material) {
  ::filament::Engine& filament = engine->engine();
  VertexBuffer* vertices = VertexBuffer::Builder()
                               .vertexCount(static_cast<uint32_t>(kFullScreenTriangle.size()))
                               .bufferCount(1)
                               .attribute(Attribute::POSITION, 0, AttributeType::FLOAT4)
                               .build(filament);
  vertices->setBufferAt(filament, 0, {kFullScreenTriangle.data(), sizeof(kFullScreenTriangle)});
  IndexBuffer* indices = IndexBuffer::Builder()
                             .indexCount(static_cast<uint32_t>(kFullScreenTriangleIndices.size()))
                             .bufferType(IndexBuffer::IndexType::USHORT)
                             .build(filament);
  indices->setBuffer(filament, {kFullScreenTriangleIndices.data(), sizeof(kFullScreenTriangleIndices)});

  utils::Entity entity = utils::EntityManager::get().create();
  RenderableManager::Builder(1)
      .boundingBox({{0, 0, 0}, {1, 1, 1}})
      .geometry(0, Primitive::TRIANGLES, vertices, indices)
      .culling(false)
      .castShadows(false)
      .receiveShadows(false)
      .build(filament, entity);
  return assign(std::move(engine), entity, {vertices, indices}, std::move(material));
}

std::shared_ptr<GeometryCore> buildDebugBox(std::shared_ptr<EngineCore> engine, const DebugBoxOptions& options,
                                            std::shared_ptr<MaterialCore> lineMaterial) {
  ::filament::Engine& filament = engine->engine();
  float3 center = toFloat3(options.center.value_or(std::tuple{0.0, 0.0, 0.0}));
  float3 halfExtent = toFloat3(options.halfExtent);
  std::vector<float3> corners;
  for (int corner = 0; corner < 8; corner++) {
    float3 sign{corner & 1 ? 1.0f : -1.0f, corner & 2 ? 1.0f : -1.0f, corner & 4 ? 1.0f : -1.0f};
    corners.push_back(center + sign * halfExtent);
  }

  VertexBuffer* vertices = VertexBuffer::Builder()
                               .vertexCount(static_cast<uint32_t>(corners.size()))
                               .bufferCount(2)
                               .attribute(Attribute::POSITION, 0, AttributeType::FLOAT3)
                               .attribute(Attribute::COLOR, 1, AttributeType::UBYTE4)
                               .normalized(Attribute::COLOR)
                               .build(filament);
  vertices->setBufferAt(
      filament, 1, ownedBuffer(std::vector<ubyte4>(corners.size(), toByteColor(options.color.value_or(std::tuple{0.0, 1.0, 0.0, 1.0})))));
  vertices->setBufferAt(filament, 0, ownedBuffer(std::move(corners)));
  IndexBuffer* indices = buildIndices(filament, {0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7});

  utils::Entity entity = utils::EntityManager::get().create();
  RenderableManager::Builder(1)
      .boundingBox({center, halfExtent})
      .geometry(0, Primitive::LINES, vertices, indices)
      .castShadows(false)
      .receiveShadows(false)
      .build(filament, entity);
  ::filament::MaterialInstance& instance = *lineMaterial->material().getDefaultInstance();
  return assign(std::move(engine), entity, {vertices, indices}, {.instance = instance, .owner = std::move(lineMaterial)});
}

} // namespace margelo::nitro::filament
