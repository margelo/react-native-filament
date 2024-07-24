//
// Created by Hanno Gödecke on 30.04.24.
//

#include "RNFEngineImpl.h"

#include "RNFReferences.h"
#include "utils/RNFConverter.h"

#include <filament/Scene.h>
#include <filament/Skybox.h>

#include <ktxreader/Ktx1Reader.h>

namespace margelo {
void EngineImpl::createAndSetSkybox(std::string hexColor, std::optional<bool> showSun, std::optional<float> envIntensity) {
  Skybox::Builder builder = Skybox::Builder();
  if (showSun.has_value()) {
    builder.showSun(showSun.value());
  }
  if (envIntensity.has_value()) {
    builder.intensity(envIntensity.value());
  }

  math::float4 sRGBColorA = Converter::hexColorToSRGBLinear(hexColor);
  builder.color(sRGBColorA);

  Skybox* skybox = builder.build(*_engine);
  _skybox = References<Skybox>::adoptEngineRef(_engine, skybox, [](std::shared_ptr<Engine> engine, Skybox* skybox) {
    Logger::log(TAG, "Destroying Skybox...");
    engine->destroy(skybox);
  });
  _scene->setSkybox(_skybox.get());
}

void EngineImpl::createAndSetSkybox(std::shared_ptr<FilamentBuffer> textureBuffer, std::optional<bool> showSun,
                                    std::optional<float> envIntensity) {
  Skybox::Builder builder = Skybox::Builder();
  if (showSun.has_value()) {
    builder.showSun(showSun.value());
  }
  if (envIntensity.has_value()) {
    builder.intensity(envIntensity.value());
  }

  if (!textureBuffer) {
    throw std::runtime_error("Texture buffer is null");
  }
  auto buffer = textureBuffer->getBuffer();
  if (buffer->getSize() == 0) {
    throw std::runtime_error("Texture buffer is empty");
  }

  auto* bundle = new image::Ktx1Bundle(buffer->getData(), buffer->getSize());
  Texture* cubemap = ktxreader::Ktx1Reader::createTexture(
      _engine.get(), *bundle, false,
      [](void* userdata) {
        auto* bundle = (image::Ktx1Bundle*)userdata;
        delete bundle;
      },
      bundle);

  builder.environment(cubemap);

  Skybox* skybox = builder.build(*_engine);
  _skybox = References<Skybox>::adoptEngineRef(_engine, skybox, [](std::shared_ptr<Engine> engine, Skybox* skybox) {
    Logger::log(TAG, "Destroying Skybox...");
    engine->destroy(skybox);
  });
  _scene->setSkybox(_skybox.get());
}

void EngineImpl::clearSkybox() {
  _scene->setSkybox(nullptr);
  _skybox = nullptr;
}

} // namespace margelo
