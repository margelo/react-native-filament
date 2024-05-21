//
// Created by Hanno Gödecke on 17.04.24.
//

#include "RNFMaterialWrapper.h"
#include "RNFRenderableManagerWrapper.h"

namespace margelo {
void MaterialWrapper::loadHybridMethods() {
  registerHybridMethod("createInstance", &MaterialWrapper::createInstance, this);
  registerHybridMethod("setDefaultFloatParameter", &MaterialWrapper::setDefaultFloatParameter, this);
  registerHybridMethod("setDefaultTextureParameter", &MaterialWrapper::setDefaultTextureParameter, this);
  registerHybridMethod("getDefaultInstance", &MaterialWrapper::getDefaultInstance, this);
  registerHybridMethod("setBaseColorSRGB", &MaterialWrapper::setBaseColorSRGB, this);
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
void MaterialWrapper::setDefaultTextureParameter(std::shared_ptr<RenderableManagerWrapper> renderableManager, std::string name,
                                                 std::shared_ptr<FilamentBuffer> buffer, const std::string& textureFlags) {

  // Create a texture from the buffer using the renderable manager:
  Texture* texture = renderableManager->createTextureFromBuffer(buffer, textureFlags);
  TextureSampler sampler =
      TextureSampler(TextureSampler::MinFilter::LINEAR, TextureSampler::MagFilter::LINEAR, TextureSampler::WrapMode::REPEAT);

  // Set the texture
  pointee()->setDefaultTextureParameter(name, texture, sampler);
}
void MaterialWrapper::setBaseColorSRGB(std::vector<double> rgba) {
  pointee()->setBaseColorSRGB(rgba);
}
std::string MaterialWrapper::getName() {
  return pointee()->getName();
}
} // namespace margelo