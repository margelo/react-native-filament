//
// Created by Hanno Gödecke on 20.03.24.
//

#include "RenderableManagerWrapper.h"
#include "EngineWrapper.h"
#include "TextureFlagsEnum.h"

#include <filament/IndexBuffer.h>
#include <gltfio/TextureProvider.h>
#include <math/norm.h>

namespace margelo {
using namespace gltfio;
using namespace math;

void RenderableManagerWrapper::loadHybridMethods() {
  registerHybridMethod("getPrimitiveCount", &RenderableManagerWrapper::getPrimitiveCount, this);
  registerHybridMethod("getMaterialInstanceAt", &RenderableManagerWrapper::getMaterialInstanceAt, this);
  registerHybridMethod("setMaterialInstanceAt", &RenderableManagerWrapper::setMaterialInstanceAt, this);
  registerHybridMethod("setAssetEntitiesOpacity", &RenderableManagerWrapper::setAssetEntitiesOpacity, this);
  registerHybridMethod("changeMaterialTextureMap", &RenderableManagerWrapper::changeMaterialTextureMap, this);
  registerHybridMethod("setCastShadow", &RenderableManagerWrapper::setCastShadow, this);
  registerHybridMethod("setReceiveShadow", &RenderableManagerWrapper::setReceiveShadow, this);
  registerHybridMethod("createPlane", &RenderableManagerWrapper::createPlane, this);
  registerHybridMethod("scaleBoundingBox", &RenderableManagerWrapper::scaleBoundingBox, this);
}

int RenderableManagerWrapper::getPrimitiveCount(std::shared_ptr<EntityWrapper> entity) {
  Entity entityInstance = entity->getEntity();
  RenderableManager::Instance renderable = _renderableManager.getInstance(entityInstance);
  return _renderableManager.getPrimitiveCount(renderable);
}

std::shared_ptr<MaterialInstanceWrapper> RenderableManagerWrapper::getMaterialInstanceAt(std::shared_ptr<EntityWrapper> entity, int index) {
  Entity entityInstance = entity->getEntity();
  RenderableManager::Instance renderable = _renderableManager.getInstance(entityInstance);
  // Note: the material instance pointer is managed by the renderable manager and should not be deleted by the user
  MaterialInstance* materialInstance = _renderableManager.getMaterialInstanceAt(renderable, index);
  return std::make_shared<MaterialInstanceWrapper>(materialInstance);
}

void RenderableManagerWrapper::setAssetEntitiesOpacity(std::shared_ptr<FilamentAssetWrapper> asset, double opacity) {
  std::shared_ptr<FilamentAsset> fAsset = asset->getAsset();
  size_t entityCount = fAsset->getEntityCount();

  // Get the pointer to the first entity
  const Entity* entities = fAsset->getRenderableEntities();

  for (size_t i = 0; i < entityCount; ++i) {
    Entity entity = entities[i];
    RenderableManager::Instance renderable = _renderableManager.getInstance(entity);
    size_t primitiveCount = _renderableManager.getPrimitiveCount(renderable);
    for (size_t j = 0; j < primitiveCount; ++j) {
      MaterialInstance* materialInstance = _renderableManager.getMaterialInstanceAt(renderable, j);
      MaterialInstanceWrapper::changeAlpha(materialInstance, opacity);
      // Replace the material instance in the renderable manager
      _renderableManager.setMaterialInstanceAt(renderable, j, materialInstance);
    }
  }
}

void RenderableManagerWrapper::setMaterialInstanceAt(std::shared_ptr<EntityWrapper> entity, int index,
                                                     std::shared_ptr<MaterialInstanceWrapper> materialInstance) {
  Entity entityInstance = entity->getEntity();
  RenderableManager::Instance renderable = _renderableManager.getInstance(entityInstance);
  _renderableManager.setMaterialInstanceAt(renderable, index, materialInstance->getMaterialInstance());
}

void RenderableManagerWrapper::changeMaterialTextureMap(std::shared_ptr<EntityWrapper> entityWrapper, const std::string& materialName,
                                                        std::shared_ptr<FilamentBuffer> textureBuffer, std::string textureFlags) {
  // Input validation:
  if (entityWrapper == nullptr) {
    throw new std::invalid_argument("Entity is null!");
  }
  if (textureBuffer == nullptr) {
    throw new std::invalid_argument("texture is null!");
  }

  TextureProvider::TextureFlags textureFlagsEnum;
  EnumMapper::convertJSUnionToEnum(textureFlags, &textureFlagsEnum);

  // The mimeType isn't actually used in the stb provider, so we can leave it out!
  const char* mimeType = nullptr;
  auto buffer = textureBuffer->getBuffer();
  Texture* texture = _textureProvider->pushTexture(buffer->getData(), buffer->getSize(), mimeType, textureFlagsEnum);
  if (texture == nullptr) {
    std::string error = _textureProvider->getPushMessage();
    Logger::log(TAG, "Error loading texture: %s", error.c_str());
    throw new std::runtime_error("Error loading texture: " + error);
  }

  // Select the first material instance from the entity
  Entity entityInstance = entityWrapper->getEntity();
  RenderableManager::Instance instance = _renderableManager.getInstance(entityInstance);
  size_t primitiveCount = _renderableManager.getPrimitiveCount(instance);
  size_t primitiveIndex = -1;
  for (size_t i = 0; i < primitiveCount; i++) {
    MaterialInstance* materialInstance = _renderableManager.getMaterialInstanceAt(instance, i);
    std::string primitiveName = materialInstance->getName();
    if (primitiveName == materialName) {
      primitiveIndex = i;
      break;
    }
  }
  if (primitiveIndex == -1) {
    throw new std::invalid_argument("Material not found!");
  }

  MaterialInstance* materialInstance = _renderableManager.getMaterialInstanceAt(instance, primitiveIndex);

  // The texture might not be loaded yet, but we can already set it on the material instance
  MaterialInstance* newInstance = MaterialInstance::duplicate(materialInstance);
  auto sampler = TextureSampler(TextureSampler::MinFilter::LINEAR, TextureSampler::MagFilter::LINEAR, TextureSampler::WrapMode::REPEAT);
  newInstance->setParameter("baseColorMap", texture, sampler);
  _renderableManager.setMaterialInstanceAt(instance, primitiveIndex, newInstance);

  // Load the texture
  startUpdateResourceLoading();
}

void RenderableManagerWrapper::startUpdateResourceLoading() {
  while (_textureProvider->getPoppedCount() < _textureProvider->getPushedCount()) {
    // The following call gives the provider an opportunity to reap the results of any
    // background decoder work that has been completed
    _textureProvider->updateQueue();

    // Check for textures that now have all their miplevels initialized.
    while (Texture* _texture = _textureProvider->popTexture()) {
      Logger::log(TAG, "%p has all its miplevels ready.", _texture);
    }
  }
}

void RenderableManagerWrapper::setCastShadow(bool castShadow, std::shared_ptr<EntityWrapper> entityWrapper) {
  if (entityWrapper == nullptr) {
    throw new std::invalid_argument("Entity is null");
  }

  Entity entity = entityWrapper->getEntity();
  RenderableManager::Instance renderable = _renderableManager.getInstance(entity);
  _renderableManager.setCastShadows(renderable, castShadow);
}

void RenderableManagerWrapper::setReceiveShadow(bool receiveShadow, std::shared_ptr<EntityWrapper> entityWrapper) {
  if (entityWrapper == nullptr) {
    throw new std::invalid_argument("Entity is null");
  }

  Entity entity = entityWrapper->getEntity();
  RenderableManager::Instance renderable = _renderableManager.getInstance(entity);
  _renderableManager.setReceiveShadows(renderable, receiveShadow);
}

std::shared_ptr<EntityWrapper> RenderableManagerWrapper::createPlane(std::shared_ptr<MaterialWrapper> materialWrapper) {
  if (materialWrapper == nullptr) {
    throw new std::invalid_argument("Material is null");
  }

  const static uint32_t indices[]{0, 1, 2, 2, 3, 0};
  const static float3 vertices[]{
      //    x   y    z
      {-10, 0, -10},
      {-10, 0, 10},
      {10, 0, 10},
      {10, 0, -10},
  };

  // All normals are pointing up
  const static short4 normals[]{{0, 1, 0, 0}, {0, 1, 0, 0}, {0, 1, 0, 0}, {0, 1, 0, 0}};

  VertexBuffer* vertexBuffer = VertexBuffer::Builder()
                                   .vertexCount(4)
                                   .bufferCount(2)
                                   .attribute(VertexAttribute::POSITION, 0, VertexBuffer::AttributeType::FLOAT3)
                                   .attribute(VertexAttribute::TANGENTS, 1, VertexBuffer::AttributeType::SHORT4)
                                   .normalized(VertexAttribute::TANGENTS)
                                   .build(*_engine);
  vertexBuffer->setBufferAt(*_engine, 0, VertexBuffer::BufferDescriptor(vertices, vertexBuffer->getVertexCount() * sizeof(vertices[0])));
  vertexBuffer->setBufferAt(*_engine, 1, VertexBuffer::BufferDescriptor(normals, vertexBuffer->getVertexCount() * sizeof(normals[0])));
  IndexBuffer* indexBuffer = IndexBuffer::Builder().indexCount(6).build(*_engine);
  indexBuffer->setBuffer(*_engine, IndexBuffer::BufferDescriptor(indices, indexBuffer->getIndexCount() * sizeof(uint32_t)));

  auto& em = utils::EntityManager::get();
  utils::Entity renderable = em.create();
  std::shared_ptr<Material> material = materialWrapper->getMaterial();
  auto test = material->createInstance();
  RenderableManager::Builder(1)
      .boundingBox({{0, 0, 0}, {10, 1e-4f, 10}})
      .material(0, test)
      .geometry(0, RenderableManager::PrimitiveType::TRIANGLES, vertexBuffer, indexBuffer, 0, 6)
      .receiveShadows(true)
      .build(*_engine, renderable);

  return std::make_shared<EntityWrapper>(renderable);
}

void RenderableManagerWrapper::scaleBoundingBox(std::shared_ptr<FilamentAssetWrapper> assetWrapper, double scaleFactor) {
  if (assetWrapper == nullptr) {
    throw new std::invalid_argument("Asset is null");
  }

  // Get bounding box from asset
  FilamentAsset* asset = assetWrapper->getAsset().get();
  size_t entityCount = asset->getRenderableEntityCount();
  const Entity* entities = asset->getRenderableEntities();
  for (size_t i = 0; i < entityCount; ++i) {
    Entity entity = entities[i];
    RenderableManager::Instance renderable = _renderableManager.getInstance(entity);
    Box boundingBox = _renderableManager.getAxisAlignedBoundingBox(renderable);
    Logger::log(TAG, "#%d Bounding box: min: %f %f %f, max: %f %f %f", i, boundingBox.getMin().x, boundingBox.getMin().y,
                boundingBox.getMin().z, boundingBox.getMax().x, boundingBox.getMax().y, boundingBox.getMax().z);
    // Create a new box that is twice the size
    Box box = Box().set(boundingBox.getMin() * scaleFactor, boundingBox.getMax() * scaleFactor);
    _renderableManager.setAxisAlignedBoundingBox(renderable, box);
  }
}

} // namespace margelo