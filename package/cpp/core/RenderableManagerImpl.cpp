//
// Created by Hanno Gödecke on 20.03.24.
//

#include "RenderableManagerImpl.h"
#include "EngineWrapper.h"
#include "TextureFlagsEnum.h"

#include <cmath>

#include <filament/IndexBuffer.h>
#include <gltfio/TextureProvider.h>
#include <math/norm.h>

namespace margelo {
using namespace gltfio;
using namespace math;

int RenderableManagerImpl::getPrimitiveCount(std::shared_ptr<EntityWrapper> entity) {
  RenderableManager& renderableManager = _engine->getRenderableManager();
  Entity entityInstance = entity->getEntity();
  RenderableManager::Instance renderable = renderableManager.getInstance(entityInstance);
  return renderableManager.getPrimitiveCount(renderable);
}

std::shared_ptr<MaterialInstanceWrapper> RenderableManagerImpl::getMaterialInstanceAt(std::shared_ptr<EntityWrapper> entity, int index) {
  RenderableManager& renderableManager = _engine->getRenderableManager();
  Entity entityInstance = entity->getEntity();
  RenderableManager::Instance renderable = renderableManager.getInstance(entityInstance);
  // Note: the material instance pointer is managed by the renderable manager and should not be deleted by the user
  MaterialInstance* materialInstance = renderableManager.getMaterialInstanceAt(renderable, index);
  return std::make_shared<MaterialInstanceWrapper>(materialInstance);
}

void RenderableManagerImpl::setAssetEntitiesOpacity(std::shared_ptr<FilamentAssetWrapper> asset, double opacity) {
  std::shared_ptr<FilamentAsset> fAsset = asset->getAsset();
  size_t instanceCount = fAsset->getAssetInstanceCount();
  FilamentInstance** instances = fAsset->getAssetInstances();
  for (size_t i = 0; i < instanceCount; ++i) {
    FilamentInstance* instance = instances[i];
    setInstanceEntitiesOpacity(instance, opacity);
  }
}

void RenderableManagerImpl::setInstanceWrapperEntitiesOpacity(std::shared_ptr<FilamentInstanceWrapper> instanceWrapper, double opacity) {
  FilamentInstance* filamentInstance = instanceWrapper->getInstance();
  setInstanceEntitiesOpacity(filamentInstance, opacity);
}

void RenderableManagerImpl::setInstanceEntitiesOpacity(FilamentInstance* instance, double opacity) {
  RenderableManager& renderableManager = _engine->getRenderableManager();
  size_t entityCount = instance->getEntityCount();

  // Get the pointer to the first entity
  const Entity* entities = instance->getEntities();

  for (size_t i = 0; i < entityCount; ++i) {
    Entity entity = entities[i];
    if (!renderableManager.hasComponent(entity)) {
      continue;
    }

    RenderableManager::Instance renderable = renderableManager.getInstance(entity);
    size_t primitiveCount = renderableManager.getPrimitiveCount(renderable);
    for (size_t j = 0; j < primitiveCount; ++j) {
      MaterialInstance* materialInstance = renderableManager.getMaterialInstanceAt(renderable, j);
      MaterialInstanceWrapper::changeAlpha(materialInstance, opacity);
      // Replace the material instance in the renderable manager
      renderableManager.setMaterialInstanceAt(renderable, j, materialInstance);
    }
  }
}

void RenderableManagerImpl::setMaterialInstanceAt(std::shared_ptr<EntityWrapper> entity, int index,
                                                  std::shared_ptr<MaterialInstanceWrapper> materialInstance) {
  RenderableManager& renderableManager = _engine->getRenderableManager();
  Entity entityInstance = entity->getEntity();
  RenderableManager::Instance renderable = renderableManager.getInstance(entityInstance);
  renderableManager.setMaterialInstanceAt(renderable, index, materialInstance->getMaterialInstance());
}

Texture* RenderableManagerImpl::createTextureFromBuffer(std::shared_ptr<FilamentBuffer> buffer, const std::string& textureFlags) {
  TextureProvider::TextureFlags textureFlagsEnum;
  EnumMapper::convertJSUnionToEnum(textureFlags, &textureFlagsEnum);

  // The mimeType isn't actually used in the stb provider, so we can leave it out!
  const char* mimeType = nullptr;
  auto bufferData = buffer->getBuffer();
  Texture* texture = _textureProvider->pushTexture(bufferData->getData(), bufferData->getSize(), mimeType, textureFlagsEnum);

  if (texture == nullptr) {
    std::string error = _textureProvider->getPushMessage();
    Logger::log(TAG, "Error loading texture: %s", error.c_str());
    throw std::runtime_error("Error loading texture: " + error);
  }

  startUpdateResourceLoading();

  return texture;
}

void RenderableManagerImpl::changeMaterialTextureMap(std::shared_ptr<EntityWrapper> entityWrapper, const std::string& materialName,
                                                     std::shared_ptr<FilamentBuffer> textureBuffer, const std::string& textureFlags) {
  // Input validation:
  if (entityWrapper == nullptr) {
    throw std::invalid_argument("Entity is null!");
  }
  if (textureBuffer == nullptr) {
    throw std::invalid_argument("texture is null!");
  }

  TextureProvider::TextureFlags textureFlagsEnum;
  EnumMapper::convertJSUnionToEnum(textureFlags, &textureFlagsEnum);

  // Select the first material instance from the entity
  RenderableManager& renderableManager = _engine->getRenderableManager();
  Entity entityInstance = entityWrapper->getEntity();
  RenderableManager::Instance instance = renderableManager.getInstance(entityInstance);
  size_t primitiveCount = renderableManager.getPrimitiveCount(instance);
  size_t primitiveIndex = -1;
  for (size_t i = 0; i < primitiveCount; i++) {
    MaterialInstance* materialInstance = renderableManager.getMaterialInstanceAt(instance, i);
    std::string primitiveName = materialInstance->getName();
    if (primitiveName == materialName) {
      primitiveIndex = i;
      break;
    }
  }
  if (primitiveIndex == -1) {
    throw std::invalid_argument("Material not found!");
  }

  // This material instance still belongs to the original asset and will be cleaned up when the asset is destroyed
  MaterialInstance* materialInstance = renderableManager.getMaterialInstanceAt(instance, primitiveIndex);

  // The texture might not be loaded yet, but we can already set it on the material instance
  auto engine = _engine;
  auto dispatcher = _rendererDispatcher;
  std::shared_ptr<MaterialInstance> newInstance =
      std::shared_ptr<MaterialInstance>(MaterialInstance::duplicate(materialInstance), [engine, dispatcher](MaterialInstance* instance) {
        dispatcher->runAsync([engine, instance]() {
          Logger::log(TAG, "Destroying material instance %p", instance);
          engine->destroy(instance);
        });
      });

  auto sampler = TextureSampler(TextureSampler::MinFilter::LINEAR, TextureSampler::MagFilter::LINEAR, TextureSampler::WrapMode::REPEAT);
  Texture* texture = createTextureFromBuffer(textureBuffer, textureFlags);
  newInstance->setParameter("baseColorMap", texture, sampler);
  renderableManager.setMaterialInstanceAt(instance, primitiveIndex, newInstance.get());
  _materialInstances.push_back(newInstance);

  // Load the texture
  startUpdateResourceLoading();
}

void RenderableManagerImpl::startUpdateResourceLoading() {
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

void RenderableManagerImpl::setCastShadow(std::shared_ptr<EntityWrapper> entityWrapper, bool castShadow) {
  if (entityWrapper == nullptr) {
    throw std::invalid_argument("Entity is null");
  }

  RenderableManager& renderableManager = _engine->getRenderableManager();
  Entity entity = entityWrapper->getEntity();
  RenderableManager::Instance renderable = renderableManager.getInstance(entity);
  renderableManager.setCastShadows(renderable, castShadow);
}

void RenderableManagerImpl::setReceiveShadow(std::shared_ptr<EntityWrapper> entityWrapper, bool receiveShadow) {
  if (entityWrapper == nullptr) {
    throw std::invalid_argument("Entity is null");
  }

  RenderableManager& renderableManager = _engine->getRenderableManager();
  Entity entity = entityWrapper->getEntity();
  RenderableManager::Instance renderable = renderableManager.getInstance(entity);
  renderableManager.setReceiveShadows(renderable, receiveShadow);
}

std::shared_ptr<EntityWrapper> RenderableManagerImpl::createPlane(std::shared_ptr<MaterialWrapper> materialWrapper, double halfExtendX,
                                                                  double halfExtendY, double halfExtendZ) {
  if (materialWrapper == nullptr) {
    throw std::invalid_argument("Material is null");
  }

  const static uint32_t indices[]{0, 1, 2, 2, 3, 0};
  const static float3 vertices[]{//       x        y       z
                                 {-halfExtendX, 0, -halfExtendZ},
                                 {-halfExtendX, 0, halfExtendZ},
                                 {halfExtendX, 0, halfExtendZ},
                                 {halfExtendX, 0, -halfExtendZ}};

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
  std::shared_ptr<MaterialInstanceWrapper> instance = materialWrapper->createInstance();
  RenderableManager::Builder(1)
      .boundingBox({{0, 0, 0}, {halfExtendX, halfExtendY, halfExtendZ}})
      .material(0, instance->getMaterialInstance())
      .geometry(0, RenderableManager::PrimitiveType::TRIANGLES, vertexBuffer, indexBuffer, 0, 6)
      .build(*_engine, renderable);

  return std::make_shared<EntityWrapper>(renderable);
}

void RenderableManagerImpl::scaleBoundingBox(std::shared_ptr<FilamentAssetWrapper> assetWrapper, double scaleFactor) {
  if (assetWrapper == nullptr) {
    throw std::invalid_argument("Asset is null");
  }
  RenderableManager& renderableManager = _engine->getRenderableManager();

  // Get bounding box from asset
  FilamentAsset* asset = assetWrapper->getAsset().get();
  size_t entityCount = asset->getRenderableEntityCount();
  const Entity* entities = asset->getRenderableEntities();
  for (size_t i = 0; i < entityCount; ++i) {
    Entity entity = entities[i];
    RenderableManager::Instance renderable = renderableManager.getInstance(entity);
    Box boundingBox = renderableManager.getAxisAlignedBoundingBox(renderable);
    Logger::log(TAG, "#%d Bounding box: min: %f %f %f, max: %f %f %f", i, boundingBox.getMin().x, boundingBox.getMin().y,
                boundingBox.getMin().z, boundingBox.getMax().x, boundingBox.getMax().y, boundingBox.getMax().z);
    // Create a new box that is twice the size
    Box box = Box().set(boundingBox.getMin() * scaleFactor, boundingBox.getMax() * scaleFactor);
    renderableManager.setAxisAlignedBoundingBox(renderable, box);
  }
}

Box RenderableManagerImpl::getAxisAlignedBoundingBox(std::shared_ptr<EntityWrapper> entityWrapper) {
  if (entityWrapper == nullptr) {
    throw std::invalid_argument("Entity is null");
  }
  RenderableManager& renderableManager = _engine->getRenderableManager();
  Entity entity = entityWrapper->getEntity();
  RenderableManager::Instance renderable = renderableManager.getInstance(entity);
  return renderableManager.getAxisAlignedBoundingBox(renderable);
}

} // namespace margelo
