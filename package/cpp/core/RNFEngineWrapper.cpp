//
// Created by Marc Rousavy on 21.02.24.
//

#include "RNFEngineWrapper.h"

#include "RNFReferences.h"
#include "RNFRendererWrapper.h"
#include "utils/RNFConverter.h"

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
  registerHybridMethod("setIndirectLight", &EngineWrapper::setIndirectLight, this);
  registerHybridMethod("loadAsset", &EngineWrapper::loadAsset, this);
  registerHybridMethod("loadInstancedAsset", &EngineWrapper::loadInstancedAsset, this);
  registerHybridMethod("getScene", &EngineWrapper::getScene, this);
  registerHybridMethod("getView", &EngineWrapper::getView, this);
  registerHybridMethod("getCamera", &EngineWrapper::getCamera, this);
  registerHybridMethod("createOrbitCameraManipulator", &EngineWrapper::createOrbitCameraManipulator, this);
  registerHybridMethod("createTransformManager", &EngineWrapper::createTransformManager, this);
  registerHybridMethod("createRenderableManager", &EngineWrapper::createRenderableManager, this);
  registerHybridMethod("createMaterial", &EngineWrapper::createMaterial, this);
  registerHybridMethod("createLightManager", &EngineWrapper::createLightManager, this);
  registerHybridMethod("createRenderer", &EngineWrapper::createRenderer, this);
  registerHybridMethod("createNameComponentManager", &EngineWrapper::createNameComponentManager, this);
  registerHybridMethod("createAndSetSkyboxByColor", &EngineWrapper::createAndSetSkyboxByColor, this);
  registerHybridMethod("createAndSetSkyboxByTexture", &EngineWrapper::createAndSetSkyboxByTexture, this);
  registerHybridMethod("clearSkybox", &EngineWrapper::clearSkybox, this);
  registerHybridMethod("setAutomaticInstancingEnabled", &EngineWrapper::setAutomaticInstancingEnabled, this);
  registerHybridMethod("flushAndWait", &EngineWrapper::flushAndWait, this);
}
void EngineWrapper::setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider) {
  pointee()->setSurfaceProvider(surfaceProvider);
}
std::shared_ptr<SwapChainWrapper> EngineWrapper::createSwapChainForSurface(std::shared_ptr<SurfaceProvider> surfaceProvider,
                                                                           bool enableTransparentRendering) {
    margelo::Logger::log(TAG, "Creating swapchain for surface ...");

  std::shared_ptr<Surface> surface = surfaceProvider->getSurfaceOrNull();
  if (surface == nullptr) {
    throw std::runtime_error("Surface is null");
  }

  void* nativeWindow = surface->getSurface();
  uint64_t flags = enableTransparentRendering ? SwapChain::CONFIG_TRANSPARENT : 0;
  std::shared_ptr<SwapChain> swapChain = pointee()->createSwapChain(nativeWindow, flags);

  return std::make_shared<SwapChainWrapper>(swapChain);
}
std::shared_ptr<SwapChainWrapper> EngineWrapper::createSwapChainForRecorder(std::shared_ptr<FilamentRecorder> recorder) {
    margelo::Logger::log(TAG, "Creating swapchain for recorder ...");

  if (recorder == nullptr) {
    throw std::invalid_argument("Recorder is null");
  }
  void* nativeWindow = recorder->getNativeWindow();

  // The flag CONFIG_APPLE_CVPIXELBUFFER is needed for iOS metal backend to allow rendering into a CVPixelBuffer. On android this flag is
  // ignored.
  std::shared_ptr<SwapChain> swapChain = pointee()->createSwapChain(nativeWindow, SwapChain::CONFIG_APPLE_CVPIXELBUFFER);

  int width = recorder->getWidth();
  int height = recorder->getHeight();
  pointee()->surfaceSizeChanged(width, height);

  return std::make_shared<SwapChainWrapper>(swapChain);
}
void EngineWrapper::setSwapChain(std::shared_ptr<SwapChainWrapper> swapChainWrapper) {
  std::shared_ptr<SwapChain> swapChain = swapChainWrapper->getSwapChain();
  pointee()->setSwapChain(swapChain);
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
  std::shared_ptr<Scene> scene = pointee()->_scene;
  return std::make_shared<SceneWrapper>(scene);
}
std::shared_ptr<ViewWrapper> EngineWrapper::getView() {
  std::shared_ptr<View> view = pointee()->_view;
  float pixelDensityRatio = pointee()->_densityPixelRatio;
  return std::make_shared<ViewWrapper>(view, pixelDensityRatio);
}
std::shared_ptr<CameraWrapper> EngineWrapper::getCamera() {
  std::shared_ptr<Camera> camera = pointee()->_camera;
  return std::make_shared<CameraWrapper>(camera);
}
std::shared_ptr<ManipulatorWrapper>
EngineWrapper::createOrbitCameraManipulator(std::unordered_map<std::string, std::vector<double>> config) {
  ManipulatorBuilder builder;

  // Parse the config
  if (config.find("orbitHomePosition") != config.end()) {
    std::vector<double> orbitHomePositionVec = config["orbitHomePosition"];
    math::float3 orbitHomePosition = Converter::VecToFloat3(orbitHomePositionVec);
    builder.orbitHomePosition(orbitHomePosition.x, orbitHomePosition.y, orbitHomePosition.z);
  }
  if (config.find("targetPosition") != config.end()) {
    std::vector<double> targetPositionVec = config["targetPosition"];
    math::float3 targetPosition = Converter::VecToFloat3(targetPositionVec);
    builder.targetPosition(targetPosition.x, targetPosition.y, targetPosition.z);
  }
  if (config.find("upVector") != config.end()) {
    std::vector<double> upVectorVec = config["upVector"];
    math::float3 upVector = Converter::VecToFloat3(upVectorVec);
    builder.upVector(upVector.x, upVector.y, upVector.z);
  }
  if (config.find("zoomSpeed") != config.end()) {
    builder.zoomSpeed(config["zoomSpeed"][0]);
  }
  if (config.find("orbitSpeed") != config.end()) {
    std::vector<double> orbitSpeedVec = config["orbitSpeed"];
    if (orbitSpeedVec.size() != 2) {
      throw std::invalid_argument("orbitSpeed must have 2 elements");
    }
    builder.orbitSpeed(orbitSpeedVec[0], orbitSpeedVec[1]);
  }

  std::shared_ptr<Manipulator<float>> manipulator = std::shared_ptr<Manipulator<float>>(builder.build(Mode::ORBIT));

  // Get current viewport size
  const Viewport& viewport = pointee()->_view->getViewport();
  manipulator->setViewport(viewport.width, viewport.height); // Its okay if they are still null here

  // Set the camera manipulator to the engine, so that on viewport resizes it will be updated
  pointee()->_cameraManipulator = manipulator;

  float pixelDensityRatio = pointee()->_densityPixelRatio;
  return std::make_shared<ManipulatorWrapper>(manipulator, pixelDensityRatio);
}
std::shared_ptr<TransformManagerWrapper> EngineWrapper::createTransformManager() {
  return pointee()->createTransformManager();
}
std::shared_ptr<LightManagerWrapper> EngineWrapper::createLightManager() {
  return pointee()->createLightManager();
}
std::shared_ptr<RendererWrapper> EngineWrapper::createRenderer() {
  std::shared_ptr<Renderer> renderer = pointee()->_renderer;
  return std::make_shared<RendererWrapper>(renderer);
}
std::shared_ptr<RenderableManagerWrapper> EngineWrapper::createRenderableManager() {
  return pointee()->createRenderableManager();
}
std::shared_ptr<NameComponentManagerWrapper> EngineWrapper::createNameComponentManager() {
  return pointee()->createNameComponentManager();
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
void EngineWrapper::flushAndWait() {
  pointee()->flushAndWait();
}

} // namespace margelo
