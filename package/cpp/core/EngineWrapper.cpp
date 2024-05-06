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

#include <chrono>
#include <unistd.h>
#include <utility>

namespace margelo {

void EngineWrapper::loadHybridMethods() {
  registerHybridMethod("setSurfaceProvider", &EngineWrapper::setSurfaceProvider, this);
  registerHybridMethod("createSwapChainForSurface", &EngineWrapper::createSwapChainForSurface, this);
  registerHybridMethod("createSwapChainForRecorder", &EngineWrapper::createSwapChainForRecorder, this);
  registerHybridMethod("setSwapChain", &EngineWrapper::setSwapChain, this);
  registerHybridMethod("render", &EngineWrapper::render, this);
  registerHybridMethod("setIndirectLight", &EngineWrapper::setIndirectLight, this);
  registerHybridMethod("loadAsset", &EngineWrapper::loadAsset, this);
  registerHybridMethod("loadInstancedAsset", &EngineWrapper::loadInstancedAsset, this);
  registerHybridMethod("getScene", &EngineWrapper::getScene, this);
  registerHybridMethod("getView", &EngineWrapper::getView, this);
  registerHybridMethod("getCamera", &EngineWrapper::getCamera, this);
  registerHybridMethod("getCameraManipulator", &EngineWrapper::getCameraManipulator, this);
  registerHybridMethod("createTransformManager", &EngineWrapper::createTransformManager, this);
  registerHybridMethod("createRenderableManager", &EngineWrapper::createRenderableManager, this);
  registerHybridMethod("createMaterial", &EngineWrapper::createMaterial, this);
  registerHybridMethod("createLightManager", &EngineWrapper::createLightManager, this);
  registerHybridMethod("createRenderer", &EngineWrapper::createRenderer, this);
  registerHybridMethod("createAndSetSkyboxByColor", &EngineWrapper::createAndSetSkyboxByColor, this);
  registerHybridMethod("createAndSetSkyboxByTexture", &EngineWrapper::createAndSetSkyboxByTexture, this);
  registerHybridMethod("clearSkybox", &EngineWrapper::clearSkybox, this);
  registerHybridMethod("setAutomaticInstancingEnabled", &EngineWrapper::setAutomaticInstancingEnabled, this);
}
void EngineWrapper::setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider) {
  pointee()->setSurfaceProvider(surfaceProvider);
}
std::shared_ptr<SwapChainWrapper> EngineWrapper::createSwapChainForSurface(std::shared_ptr<SurfaceProvider> surfaceProvider,
                                                                           bool enableTransparentRendering) {
  Logger::log(TAG, "Creating swapchain for surface ...");

  std::shared_ptr<Surface> surface = surfaceProvider->getSurfaceOrNull();
  if (surface == nullptr) {
    throw std::runtime_error("Surface is null");
  }

  void* nativeWindow = surface->getSurface();
  // TODO: make flags configurable
  uint64_t flags = enableTransparentRendering ? SwapChain::CONFIG_TRANSPARENT : 0;
  std::shared_ptr<SwapChain> swapChain = pointee()->createSwapChain(nativeWindow, flags);

  return std::make_shared<SwapChainWrapper>(swapChain);
}
std::shared_ptr<SwapChainWrapper> EngineWrapper::createSwapChainForRecorder(std::shared_ptr<FilamentRecorder> recorder) {
  Logger::log(TAG, "Creating swapchain for recorder ...");

  if (recorder == nullptr) {
    throw std::invalid_argument("Recorder is null");
  }
  void* nativeWindow = recorder->getNativeWindow();

  // TODO: make this flag configurable, or get from platform settings?
  std::shared_ptr<SwapChain> swapChain = pointee()->createSwapChain(nativeWindow, SwapChain::CONFIG_APPLE_CVPIXELBUFFER);
  pointee()->setFrameCompletedCallback([recorder](double timestamp) { recorder->renderFrame(timestamp); });

  return std::make_shared<SwapChainWrapper>(swapChain);
}
void EngineWrapper::setSwapChain(std::shared_ptr<SwapChainWrapper> swapChainWrapper) {
  std::shared_ptr<SwapChain> swapChain = swapChainWrapper->getSwapChain();
  pointee()->setSwapChain(swapChain);
}
void EngineWrapper::render(double timestamp) {
  pointee()->render(timestamp);
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
void EngineWrapper::setAutomaticInstancingEnabled(bool enabled) {
  pointee()->setAutomaticInstancingEnabled(enabled);
}

} // namespace margelo
