//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include "jsi/PointerHolder.h"

#include "CameraWrapper.h"
#include "Choreographer.h"
#include "FilamentAssetWrapper.h"
#include "FilamentBuffer.h"
#include "RenderableManagerWrapper.h"
#include "SceneWrapper.h"
#include "Surface.h"
#include "SurfaceProvider.h"
#include "SwapChainWrapper.h"
#include "ViewWrapper.h"
#include "bullet/RigidBodyWrapper.h"
#include "core/utils/EntityWrapper.h"
#include "core/utils/ManipulatorWrapper.h"

#include <camutils/Manipulator.h>
#include <filament/Engine.h>
#include <filament/LightManager.h>
#include <filament/Renderer.h>
#include <filament/SwapChain.h>
#include <gltfio/AssetLoader.h>
#include <gltfio/MaterialProvider.h>
#include <gltfio/ResourceLoader.h>
#include <gltfio/TextureProvider.h>

#include "CameraWrapper.h"
#include "LightManagerWrapper.h"
#include "MaterialWrapper.h"
#include "SceneWrapper.h"
#include "SwapChainWrapper.h"
#include "TransformManagerWrapper.h"
#include "ViewWrapper.h"
#include "threading/Dispatcher.h"
#include <Choreographer.h>
#include <FilamentBuffer.h>
#include <camutils/Manipulator.h>
#include <core/utils/ManipulatorWrapper.h>
#include <utils/NameComponentManager.h>

namespace margelo {

using namespace filament;
using namespace camutils;

using ManipulatorBuilder = Manipulator<float>::Builder;

using RenderCallback = std::function<void(double, double, double)>;

// The EngineImpl is the actual implementation wrapper around filaments Engine.
// If you add a new method that you want to expose to JS, you need to add it to the EngineWrapper as well.
class EngineImpl : std::enable_shared_from_this<EngineImpl> {
public:
  explicit EngineImpl(std::shared_ptr<Choreographer> choreographer, std::shared_ptr<Dispatcher> rendererDispatcher,
                      std::shared_ptr<Engine> engine);

  void setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider);
  void setRenderCallback(std::optional<RenderCallback> callback);
  void setIndirectLight(std::shared_ptr<FilamentBuffer> modelBuffer, std::optional<double> intensity, std::optional<int> irradianceBands);
  std::shared_ptr<FilamentAssetWrapper> loadAsset(std::shared_ptr<FilamentBuffer> modelBuffer);
  std::shared_ptr<FilamentAssetWrapper> loadInstancedAsset(std::shared_ptr<FilamentBuffer> modelBuffer, int instanceCount);
  std::shared_ptr<LightManagerWrapper> createLightManager();
  void setEntityPosition(std::shared_ptr<EntityWrapper> entity, std::vector<double> positionVec, bool multiplyCurrent);
  void setEntityRotation(std::shared_ptr<EntityWrapper> entity, double angleRadians, std::vector<double> axisVec, bool multiplyCurrent);
  void setEntityScale(std::shared_ptr<EntityWrapper> entity, std::vector<double> scaleVec, bool multiplyCurrent);
  void updateTransformByRigidBody(std::shared_ptr<EntityWrapper> entityWrapper, std::shared_ptr<RigidBodyWrapper> rigidBody);
  void transformToUnitCube(std::shared_ptr<FilamentAssetWrapper> asset);
  void setIsPaused(bool isPaused);
  std::shared_ptr<RenderableManagerWrapper> createRenderableManager();
  std::shared_ptr<MaterialWrapper> createMaterial(std::shared_ptr<FilamentBuffer> materialBuffer);

private:
  void setSurface(std::shared_ptr<Surface> surface);
  void destroySurface();
  void surfaceSizeChanged(int width, int height);
  __attribute__((hot)) void renderFrame(double timestamp);

  void synchronizePendingFrames();

  void updateTransform(math::mat4 transform, std::shared_ptr<EntityWrapper> entity, bool multiplyCurrent);

  // Internal helper method to turn an FilamentAsset ptr into a FilamentAssetWrapper
  std::shared_ptr<FilamentAssetWrapper> makeAssetWrapper(FilamentAsset* assetPtr);

private:
  std::mutex _mutex;
  std::shared_ptr<Engine> _engine;
  std::shared_ptr<Dispatcher> _rendererDispatcher;
  std::shared_ptr<SurfaceProvider> _surfaceProvider;
  std::shared_ptr<Listener> _surfaceListener;
  std::optional<RenderCallback> _renderCallback;
  std::shared_ptr<Choreographer> _choreographer;
  std::shared_ptr<Listener> _choreographerListener;
  double _startTime = 0;
  bool _isPaused = false;

  // Internals that we might need to split out later
  std::shared_ptr<gltfio::MaterialProvider> _materialProvider;
  std::shared_ptr<gltfio::AssetLoader> _assetLoader;
  std::shared_ptr<gltfio::ResourceLoader> _resourceLoader;

  const math::float3 defaultObjectPosition = {0.0f, 0.0f, 0.0f};
  const math::float3 defaultCameraPosition = {0.0f, 0.0f, 0.0f};

private:
  // Internals we create, but share the access with the user
  std::shared_ptr<Renderer> _renderer;
  std::shared_ptr<SwapChainWrapper> _swapChain;
  std::shared_ptr<Scene> _scene;
  std::shared_ptr<View> _view;
  std::shared_ptr<Camera> _camera;
  std::shared_ptr<ManipulatorWrapper> _cameraManipulator;
  std::shared_ptr<TransformManagerWrapper> _transformManager;

private:
  std::shared_ptr<Renderer> createRenderer();
  std::shared_ptr<SwapChainWrapper> createSwapChain(std::shared_ptr<Surface> surface);
  std::shared_ptr<Scene> createScene();
  std::shared_ptr<View> createView();
  std::shared_ptr<Camera> createCamera();
  std::shared_ptr<ManipulatorWrapper> createCameraManipulator(int windowWidth, int windowHeight);
  std::shared_ptr<TransformManagerWrapper> createTransformManager();

public:
  // Getters for shared objects
  std::shared_ptr<SwapChainWrapper> getSwapChain() {
    return _swapChain;
  }
  std::shared_ptr<SceneWrapper> getScene() {
    return std::make_shared<SceneWrapper>(_scene);
  }
  std::shared_ptr<ViewWrapper> getView() {
    return std::make_shared<ViewWrapper>(_view);
  }
  std::shared_ptr<CameraWrapper> getCamera() {
    return std::make_shared<CameraWrapper>(_camera);
  }
  std::shared_ptr<ManipulatorWrapper> getCameraManipulator() {
    return _cameraManipulator;
  }
  std::shared_ptr<TransformManagerWrapper> getTransformManager() {
    return _transformManager;
  }

private:
  static constexpr auto TAG = "EngineImpl";
};

} // namespace margelo
