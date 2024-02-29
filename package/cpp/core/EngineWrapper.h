//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include "jsi/HybridObject.h"

#include "CameraWrapper.h"
#include "Choreographer.h"
#include "FilamentAssetWrapper.h"
#include "FilamentBuffer.h"
#include "RendererWrapper.h"
#include "SceneWrapper.h"
#include "Surface.h"
#include "SurfaceProvider.h"
#include "SwapChainWrapper.h"
#include "ViewWrapper.h"
#include "core/utils/EntityWrapper.h"
#include "core/utils/ManipulatorWrapper.h"

#include <camutils/Manipulator.h>
#include <filament/Engine.h>
#include <filament/LightManager.h>
#include <filament/SwapChain.h>
#include <gltfio/AssetLoader.h>
#include <gltfio/MaterialProvider.h>
#include <gltfio/ResourceLoader.h>
#include <gltfio/TextureProvider.h>

namespace margelo {

using namespace filament;
using namespace camutils;

using ManipulatorBuilder = Manipulator<float>::Builder;

class EngineWrapper : public HybridObject {
public:
  explicit EngineWrapper(std::shared_ptr<Choreographer> choreographer);
  ~EngineWrapper();

  void setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider);

  void loadHybridMethods() override;

private:
  void setSurface(std::shared_ptr<Surface> surface);
  void destroySurface();
  void surfaceSizeChanged(int width, int height);
  void setRenderCallback(std::function<void(std::shared_ptr<EngineWrapper>)> callback);
  void renderFrame(double timestamp);

  void transformToUnitCube(std::shared_ptr<FilamentAssetWrapper> asset);
  std::shared_ptr<FilamentAssetWrapper> loadAsset(std::shared_ptr<FilamentBuffer> modelBuffer);
  void setIndirectLight(std::shared_ptr<FilamentBuffer> modelBuffer);

//  void updateCameraProjection();
  void synchronizePendingFrames();

  std::shared_ptr<EntityWrapper> createLightEntity(std::string lightTypeStr, double colorFahrenheit, double intensity, double directionX,
                                                   double directionY, double directionZ, bool castShadows);

private:
  std::shared_ptr<Engine> _engine;
  std::shared_ptr<SurfaceProvider> _surfaceProvider;
  std::shared_ptr<Listener> _listener;
  std::function<void(std::shared_ptr<EngineWrapper>)> _renderCallback;
  std::function<std::shared_ptr<FilamentBuffer>(std::string)> _getAssetBytes;
  std::shared_ptr<Choreographer> _choreographer;
  std::shared_ptr<Listener> _choreographerListener;
  gltfio::Animator* _animator; // TODO: we currently only have one animator for one asset, need to have multiple in the future
  double _startTime = 0;

  // Internals that we might need to split out later
  gltfio::MaterialProvider* _materialProvider;
  gltfio::AssetLoader* _assetLoader;
  gltfio::ResourceLoader* _resourceLoader;

  const math::float3 defaultObjectPosition = {0.0f, 0.0f, 0.0f};
  const math::float3 defaultCameraPosition = {0.0f, 0.0f, 0.0f};

private:
  // Internals we create, but share the access with the user
  std::shared_ptr<RendererWrapper> _renderer;
  std::shared_ptr<SwapChainWrapper> _swapChain;
  std::shared_ptr<SceneWrapper> _scene;
  std::shared_ptr<ViewWrapper> _view;
  std::shared_ptr<CameraWrapper> _camera;
  std::shared_ptr<ManipulatorWrapper> _cameraManipulator;

private:
  std::shared_ptr<RendererWrapper> createRenderer();
  std::shared_ptr<SwapChainWrapper> createSwapChain(std::shared_ptr<Surface> surface);
  std::shared_ptr<SceneWrapper> createScene();
  std::shared_ptr<ViewWrapper> createView();
  std::shared_ptr<CameraWrapper> createCamera();
  std::shared_ptr<ManipulatorWrapper> createCameraManipulator(int windowWidth, int windowHeight);

private:
  // Getters for shared objects
  std::shared_ptr<RendererWrapper> getRenderer() {
    return _renderer;
  }
  std::shared_ptr<SwapChainWrapper> getSwapChain() {
    return _swapChain;
  }
  std::shared_ptr<SceneWrapper> getScene() {
    return _scene;
  }
  std::shared_ptr<ViewWrapper> getView() {
    return _view;
  }
  std::shared_ptr<CameraWrapper> getCamera() {
    return _camera;
  }
  std::shared_ptr<ManipulatorWrapper> getCameraManipulator() {
    return _cameraManipulator;
  }
};

} // namespace margelo
