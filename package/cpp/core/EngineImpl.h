//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include "jsi/PointerHolder.h"

#include "CameraWrapper.h"
#include "Choreographer.h"
#include "FilamentAssetWrapper.h"
#include "FilamentBuffer.h"
#include "FilamentRecorder.h"
#include "LightManagerWrapper.h"
#include "MaterialWrapper.h"
#include "RenderableManagerWrapper.h"
#include "RendererWrapper.h"
#include "SceneWrapper.h"
#include "Surface.h"
#include "SurfaceProvider.h"
#include "SwapChainWrapper.h"
#include "TransformManagerWrapper.h"
#include "ViewWrapper.h"
#include "bullet/RigidBodyWrapper.h"
#include "core/utils/EntityWrapper.h"
#include "core/utils/ManipulatorWrapper.h"
#include "threading/Dispatcher.h"

#include <camutils/Manipulator.h>
#include <filament/Engine.h>
#include <filament/LightManager.h>
#include <filament/Renderer.h>
#include <filament/Skybox.h>
#include <filament/SwapChain.h>
#include <gltfio/AssetLoader.h>
#include <gltfio/MaterialProvider.h>
#include <gltfio/ResourceLoader.h>
#include <gltfio/TextureProvider.h>
#include <utils/NameComponentManager.h>

namespace margelo {

using namespace filament;
using namespace camutils;

using ManipulatorBuilder = Manipulator<float>::Builder;

// The EngineImpl is the actual implementation wrapper around filaments Engine.
// If you add a new method that you want to expose to JS, you need to add it to the EngineWrapper as well.
class EngineImpl : public std::enable_shared_from_this<EngineImpl> {
public:
  explicit EngineImpl(std::shared_ptr<Dispatcher> rendererDispatcher, std::shared_ptr<Engine> engine, float displayRefreshRate,
                      float densityPixelRatio);

  // First a surface provider must be set, then once we have a surface a swapchain can be created and finally the swapchain can be set
  void setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider);
  std::shared_ptr<SwapChain> createSwapChain(void* nativeWindow, u_int64_t flags);
  void setSwapChain(std::shared_ptr<SwapChain> swapChain);
  void surfaceSizeChanged(int width, int height);

  __attribute__((hot)) void render(double timestamp, bool respectVSync);

  void setIndirectLight(std::shared_ptr<FilamentBuffer> modelBuffer, std::optional<double> intensity, std::optional<int> irradianceBands);
  std::shared_ptr<FilamentAssetWrapper> loadAsset(std::shared_ptr<FilamentBuffer> modelBuffer);
  std::shared_ptr<FilamentAssetWrapper> loadInstancedAsset(std::shared_ptr<FilamentBuffer> modelBuffer, int instanceCount);
  std::shared_ptr<LightManagerWrapper> createLightManager();
  std::shared_ptr<RenderableManagerWrapper> createRenderableManager();
  std::shared_ptr<TransformManagerWrapper> createTransformManager();
  std::shared_ptr<MaterialWrapper> createMaterial(std::shared_ptr<FilamentBuffer> materialBuffer);
  void createAndSetSkybox(std::string hexColor, std::optional<bool> showSun, std::optional<float> envIntensity);
  void createAndSetSkybox(std::optional<std::shared_ptr<FilamentBuffer>> textureBuffer, std::optional<bool> showSun,
                          std::optional<float> envIntensity);
  void clearSkybox();
  void setAutomaticInstancingEnabled(bool enabled);

  void flushAndWait();

private:
  std::mutex _mutex;
  std::shared_ptr<Engine> _engine;
  std::shared_ptr<Dispatcher> _rendererDispatcher;
  std::shared_ptr<SurfaceProvider> _surfaceProvider;
  std::shared_ptr<Listener> _surfaceListener;
  std::shared_ptr<gltfio::MaterialProvider> _materialProvider;
  std::shared_ptr<gltfio::AssetLoader> _assetLoader;
  std::shared_ptr<gltfio::ResourceLoader> _resourceLoader;
  std::shared_ptr<Skybox> _skybox = nullptr;

  const math::float3 defaultObjectPosition = {0.0f, 0.0f, 0.0f};
  const math::float3 defaultCameraPosition = {0.0f, 0.0f, 0.0f};

  std::function<void(double)> _frameCompletedCallback;
  float _densityPixelRatio;

private:
  // Internals we create, but share the access with the user
  std::shared_ptr<Renderer> _renderer;
  std::shared_ptr<SwapChain> _swapChain;
  std::shared_ptr<Scene> _scene;
  std::shared_ptr<View> _view;
  std::shared_ptr<Camera> _camera;
  std::shared_ptr<ManipulatorWrapper> _cameraManipulator;

private:
  void synchronizePendingFrames();
  std::shared_ptr<Renderer> createRenderer(float displayRefreshRate);
  std::shared_ptr<Scene> createScene();
  std::shared_ptr<View> createView();
  std::shared_ptr<Camera> createCamera();
  std::shared_ptr<ManipulatorWrapper> createCameraManipulator(int windowWidth, int windowHeight);
  // Internal helper method to turn an FilamentAsset ptr into a FilamentAssetWrapper
  std::shared_ptr<FilamentAssetWrapper> makeAssetWrapper(FilamentAsset* assetPtr);

public:
  // Getters for shared objects
  std::shared_ptr<SceneWrapper> getScene() {
    return std::make_shared<SceneWrapper>(_scene);
  }
  std::shared_ptr<ViewWrapper> getView() {
    return std::make_shared<ViewWrapper>(_view, _densityPixelRatio);
  }
  std::shared_ptr<CameraWrapper> getCamera() {
    return std::make_shared<CameraWrapper>(_camera);
  }
  std::shared_ptr<ManipulatorWrapper> getCameraManipulator() {
    return _cameraManipulator;
  }
  std::shared_ptr<RendererWrapper> getRenderer() {
    return std::make_shared<RendererWrapper>(_renderer);
  }

private:
  static constexpr auto TAG = "EngineImpl";
};

} // namespace margelo
