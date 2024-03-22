//
// Created by Hanno Gödecke on 20.03.24.
//

#include "RenderableManagerWrapper.h"
#include "EngineWrapper.h"
#include "TextureFlagsEnum.h"

#include <gltfio/TextureProvider.h>

namespace margelo {
using namespace gltfio;

void RenderableManagerWrapper::loadHybridMethods() {
  registerHybridMethod("getPrimitiveCount", &RenderableManagerWrapper::getPrimitiveCount, this);
  registerHybridMethod("getMaterialInstanceAt", &RenderableManagerWrapper::getMaterialInstanceAt, this);
  registerHybridMethod("setMaterialInstanceAt", &RenderableManagerWrapper::setMaterialInstanceAt, this);
  registerHybridMethod("setAssetEntitiesOpacity", &RenderableManagerWrapper::setAssetEntitiesOpacity, this);
  registerHybridMethod("changeMaterialTextureMap", &RenderableManagerWrapper::changeMaterialTextureMap, this);
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

} // namespace margelo