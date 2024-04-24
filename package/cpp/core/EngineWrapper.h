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
#include "EngineImpl.h"
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

// The EngineWrapper is just the JSI wrapper around the EngineImpl
// its important to only hold a reference to one shared_ptr, so we can easily release it from JS
class EngineWrapper : public PointerHolder<EngineImpl> {
public:
  explicit EngineWrapper(std::shared_ptr<EngineImpl> engineImpl) : PointerHolder("EngineWrapper", engineImpl) {}

  void loadHybridMethods() override;

private: // Exposed public JS API
  void setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider);
  void setRenderCallback(std::optional<RenderCallback> callback);
  void setIndirectLight(std::shared_ptr<FilamentBuffer> modelBuffer, std::optional<double> intensity, std::optional<int> irradianceBands);
  std::shared_ptr<FilamentAssetWrapper> loadAsset(std::shared_ptr<FilamentBuffer> modelBuffer);
  std::shared_ptr<FilamentAssetWrapper> loadInstancedAsset(std::shared_ptr<FilamentBuffer> modelBuffer, int instanceCount);
  std::shared_ptr<SceneWrapper> getScene();
  std::shared_ptr<ViewWrapper> getView();
  std::shared_ptr<CameraWrapper> getCamera();
  std::shared_ptr<ManipulatorWrapper> getCameraManipulator();
  std::shared_ptr<TransformManagerWrapper> createTransformManager();
  std::shared_ptr<LightManagerWrapper> createLightManager();
  std::shared_ptr<RendererWrapper> createRenderer();
  void setIsPaused(bool isPaused);
  std::shared_ptr<RenderableManagerWrapper> createRenderableManager();
  std::shared_ptr<MaterialWrapper> createMaterial(std::shared_ptr<FilamentBuffer> materialBuffer);

private:
  static constexpr auto TAG = "EngineWrapper";
};

} // namespace margelo
