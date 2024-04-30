//
// Created by Marc Rousavy on 21.02.24.
//

#include "EngineWrapper.h"

#include "References.h"
#include "utils/Converter.h"

#include <filament/Color.h>
#include <filament/Engine.h>
#include <filament/Fence.h>
#include <filament/IndirectLight.h>
#include <filament/LightManager.h>
#include <filament/RenderableManager.h>
#include <filament/SwapChain.h>
#include <filament/TransformManager.h>
#include <utils/Entity.h>
#include <utils/EntityManager.h>

#include <gltfio/Animator.h>
#include <gltfio/MaterialProvider.h>
#include <gltfio/materials/uberarchive.h>

#include <ktxreader/Ktx1Reader.h>

#include <unistd.h>
#include <utility>

namespace margelo {

void EngineWrapper::loadHybridMethods() {
  registerHybridMethod("setSurfaceProvider", &EngineWrapper::setSurfaceProvider, this);
  registerHybridMethod("setRenderCallback", &EngineWrapper::setRenderCallback, this);
  registerHybridMethod("setIndirectLight", &EngineWrapper::setIndirectLight, this);
  registerHybridMethod("loadAsset", &EngineWrapper::loadAsset, this);
  registerHybridMethod("loadInstancedAsset", &EngineWrapper::loadInstancedAsset, this);
  registerHybridMethod("getScene", &EngineWrapper::getScene, this);
  registerHybridMethod("getView", &EngineWrapper::getView, this);
  registerHybridMethod("getCamera", &EngineWrapper::getCamera, this);
  registerHybridMethod("getCameraManipulator", &EngineWrapper::getCameraManipulator, this);
  registerHybridMethod("setIsPaused", &EngineWrapper::setIsPaused, this);
  registerHybridMethod("createTransformManager", &EngineWrapper::createTransformManager, this);
  registerHybridMethod("createRenderableManager", &EngineWrapper::createRenderableManager, this);
  registerHybridMethod("createMaterial", &EngineWrapper::createMaterial, this);
  registerHybridMethod("createLightManager", &EngineWrapper::createLightManager, this);
  registerHybridMethod("createRenderer", &EngineWrapper::createRenderer, this);
  registerHybridMethod("createAndSetSkyboxByColor", &EngineWrapper::createAndSetSkyboxByColor, this);
  registerHybridMethod("createAndSetSkyboxByTexture", &EngineWrapper::createAndSetSkyboxByTexture, this);
  registerHybridMethod("clearSkybox", &EngineWrapper::clearSkybox, this);
}
void EngineWrapper::setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider) {
  pointee()->setSurfaceProvider(surfaceProvider);
}
void EngineWrapper::setRenderCallback(std::optional<RenderCallback> callback) {
  pointee()->setRenderCallback(callback);
}
void EngineWrapper::setIndirectLight(std::shared_ptr<FilamentBuffer> modelBuffer, std::optional<double> intensity,
                                     std::optional<int> irradianceBands) {
  pointee()->setIndirectLight(modelBuffer, intensity, irradianceBands);
}
std::shared_ptr<FilamentAssetWrapper> EngineWrapper::loadAsset(std::shared_ptr<FilamentBuffer> modelBuffer) {
  return pointee()->loadAsset(modelBuffer);
}
std::shared_ptr<FilamentAssetWrapper> EngineWrapper::loadInstancedAsset(std::shared_ptr<FilamentBuffer> modelBuffer, int instanceCount) {
  return pointee()->loadInstancedAsset(modelBuffer, instanceCount);
}
std::shared_ptr<SceneWrapper> EngineWrapper::getScene() {
  return pointee()->getScene();
}
std::shared_ptr<ViewWrapper> EngineWrapper::getView() {
  return pointee()->getView();
}
std::shared_ptr<CameraWrapper> EngineWrapper::getCamera() {
  return pointee()->getCamera();
}
std::shared_ptr<ManipulatorWrapper> EngineWrapper::getCameraManipulator() {
  return pointee()->getCameraManipulator();
}
std::shared_ptr<TransformManagerWrapper> EngineWrapper::createTransformManager() {
  return pointee()->createTransformManager();
}
std::shared_ptr<LightManagerWrapper> EngineWrapper::createLightManager() {
  return pointee()->createLightManager();
}
std::shared_ptr<RendererWrapper> EngineWrapper::createRenderer() {
  return pointee()->getRenderer();
}

void EngineWrapper::setIsPaused(bool isPaused) {
  pointee()->setIsPaused(isPaused);
}
std::shared_ptr<RenderableManagerWrapper> EngineWrapper::createRenderableManager() {
  return pointee()->createRenderableManager();
}
std::shared_ptr<MaterialWrapper> EngineWrapper::createMaterial(std::shared_ptr<FilamentBuffer> materialBuffer) {
  return pointee()->createMaterial(materialBuffer);
}
void EngineWrapper::createAndSetSkyboxByColor(std::string hexColor, std::optional<bool> showSun, std::optional<float> envIntensity) {
  pointee()->createAndSetSkybox(hexColor, showSun, envIntensity);
}
void EngineWrapper::createAndSetSkyboxByTexture(std::shared_ptr<FilamentBuffer> textureBuffer, std::optional<bool> showSun,
                                                std::optional<float> envIntensity) {
  pointee()->createAndSetSkybox(textureBuffer, showSun, envIntensity);
}
void EngineWrapper::clearSkybox() {
  pointee()->clearSkybox();
}

} // namespace margelo
