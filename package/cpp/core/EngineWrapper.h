//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include "Surface.h"
#include "SurfaceProvider.h"
#include <core/utils/EntityWrapper.h>
#include <filament/Engine.h>
#include <filament/SwapChain.h>
#include <gltfio/AssetLoader.h>
#include <gltfio/MaterialProvider.h>
#include <gltfio/ResourceLoader.h>
#include <gltfio/TextureProvider.h>

#include "CameraWrapper.h"
#include "RendererWrapper.h"
#include "SceneWrapper.h"
#include "SwapChainWrapper.h"
#include "ViewWrapper.h"
#include "jsi/HybridObject.h"
#include <FilamentBuffer.h>
#include <camutils/Manipulator.h>
#include <core/utils/ManipulatorWrapper.h>

namespace margelo {

using namespace filament;
using namespace camutils;

using ManipulatorBuilder = Manipulator<float>::Builder;

class EngineWrapper : public HybridObject {
public:
  explicit EngineWrapper();
  ~EngineWrapper();

  void setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider);

  void loadHybridMethods() override;

private:
  void setSurface(std::shared_ptr<Surface> surface);
  void destroySurface();
  // Wrapper methods
  std::shared_ptr<RendererWrapper> createRenderer();
  std::shared_ptr<SceneWrapper> createScene();
  std::shared_ptr<CameraWrapper> createCamera();
  std::shared_ptr<ViewWrapper> createView();
  std::shared_ptr<SwapChainWrapper> createSwapChain(std::shared_ptr<Surface> surface);
  void loadAsset(std::shared_ptr<FilamentBuffer> modelBuffer, std::shared_ptr<SceneWrapper> scene);

  // Custom simplification methods
  std::shared_ptr<EntityWrapper> createDefaultLight();
  std::shared_ptr<ManipulatorWrapper> createCameraManipulator(int windowWidth, int windowHeight);

private:
  std::shared_ptr<Engine> _engine;
  std::shared_ptr<SurfaceProvider> _surfaceProvider;
  std::shared_ptr<Listener> _listener;

  // Internals that we might need to split out later
  filament::gltfio::MaterialProvider* _materialProvider;
  filament::gltfio::AssetLoader* _assetLoader;
  filament::gltfio::ResourceLoader* _resourceLoader;

  const float defaultObjectPositionX = 0.0f;
  const float defaultObjectPositionY = 0.0f;
  const float defaultObjectPositionZ = -4.0f;

private:
  void transformToUnitCube(filament::gltfio::FilamentAsset* asset);
};

} // namespace margelo
