//
// Created by Hanno Gödecke on 17.04.24.
//

#include "RNFMaterialWrapper.h"
#include "RNFRenderableManagerWrapper.h"

#include <filament/Texture.h>

namespace margelo {
void MaterialWrapper::loadHybridMethods() {
  registerHybridMethod("createInstance", &MaterialWrapper::createInstance, this);
  registerHybridMethod("setDefaultFloatParameter", &MaterialWrapper::setDefaultFloatParameter, this);
  registerHybridMethod("setDefaultTextureParameter", &MaterialWrapper::setDefaultTextureParameter, this);
  registerHybridMethod("getDefaultInstance", &MaterialWrapper::getDefaultInstance, this);
  registerHybridMethod("setDefaultMat3fParameter", &MaterialWrapper::setDefaultMat3fParameter, this);
  registerHybridMethod("setDefaultFloat3Parameter", &MaterialWrapper::setDefaultFloat3Parameter, this);
  registerHybridMethod("setDefaultFloat4Parameter", &MaterialWrapper::setDefaultFloat4Parameter, this);
  registerHybridMethod("setDefaultIntParameter", &MaterialWrapper::setDefaultIntParameter, this);
}
std::shared_ptr<MaterialInstanceWrapper> MaterialWrapper::createInstance() {
  return pointee()->createInstance();
}
std::shared_ptr<MaterialInstanceWrapper> MaterialWrapper::getDefaultInstance() {
  return pointee()->getDefaultInstance();
}
void MaterialWrapper::setDefaultFloatParameter(std::string name, double value) {
  pointee()->setDefaultFloatParameter(name, value);
}
std::unordered_map<std::string, int>
MaterialWrapper::setDefaultTextureParameter(std::shared_ptr<RenderableManagerWrapper> renderableManager, std::string name,
                                            std::shared_ptr<FilamentBuffer> buffer, const std::string& textureFlags) {

  // Create a texture from the buffer using the renderable manager:
  Texture* texture = renderableManager->createTextureFromBuffer(buffer, textureFlags);
  TextureSampler sampler =
      TextureSampler(TextureSampler::MinFilter::LINEAR, TextureSampler::MagFilter::LINEAR, TextureSampler::WrapMode::REPEAT);

  // Set the texture
  pointee()->setDefaultTextureParameter(name, texture, sampler);

  // Return the texture size
  std::unordered_map<std::string, int> textureSize;
  textureSize["width"] = texture->getWidth();
  textureSize["height"] = texture->getHeight();
  return textureSize;
}

void MaterialWrapper::setDefaultIntParameter(std::string name, int value) {
  pointee()->setDefaultIntParameter(name, value);
}
void MaterialWrapper::setDefaultFloat3Parameter(std::string name, std::vector<double> vector) {
  pointee()->setDefaultFloat3Parameter(name, vector);
}
void MaterialWrapper::setDefaultFloat4Parameter(std::string name, std::vector<double> vector) {
  pointee()->setDefaultFloat4Parameter(name, vector);
}

void MaterialWrapper::setDefaultMat3fParameter(std::string name, std::vector<double> value) {
  pointee()->setDefaultMat3fParameter(name, value);
}
std::string MaterialWrapper::getName() {
  return pointee()->getName();
}
} // namespace margelo