//
// Created by Marc Rousavy on 21.02.24.
//

#include "EngineWrapper.h"

#include "References.h"
#include <filament/Color.h>
#include <filament/Engine.h>
#include <filament/LightManager.h>
#include <filament/SwapChain.h>
#include <utils/Entity.h>
#include <utils/EntityManager.h>

#include <gltfio/MaterialProvider.h>
#include <gltfio/materials/uberarchive.h>

namespace margelo {

EngineWrapper::EngineWrapper() {
  // TODO: make the enum for the backend for the engine configurable
  _engine = References<Engine>::adoptRef(Engine::create(), [](Engine* engine) { filament::Engine::destroy(&engine); });
  _materialProvider = filament::gltfio::createUbershaderProvider(_engine.get(), UBERARCHIVE_DEFAULT_DATA, UBERARCHIVE_DEFAULT_SIZE);
  _assetLoader =
      filament::gltfio::AssetLoader::create(filament::gltfio::AssetConfiguration{.engine = _engine.get(), .materials = _materialProvider});
  _resourceLoader = new filament::gltfio::ResourceLoader({.engine = _engine.get(), .normalizeSkinningWeights = true});
  // Add texture providers to the resource loader
  auto stbProvider = filament::gltfio::createStbProvider(_engine.get());
  auto ktx2Provider = filament::gltfio::createKtx2Provider(_engine.get());
  _resourceLoader->addTextureProvider("image/jpeg", stbProvider);
  _resourceLoader->addTextureProvider("image/png", stbProvider);
  _resourceLoader->addTextureProvider("image/ktx2", ktx2Provider);
}

EngineWrapper::~EngineWrapper() {
  filament::gltfio::AssetLoader::destroy(&_assetLoader);
  _materialProvider->destroyMaterials();
}

void EngineWrapper::loadHybridMethods() {
  registerHybridMethod("setSurfaceProvider", &EngineWrapper::setSurfaceProvider, this);
  registerHybridMethod("createRenderer", &EngineWrapper::createRenderer, this);
  registerHybridMethod("createScene", &EngineWrapper::createScene, this);
  registerHybridMethod("createCamera", &EngineWrapper::createCamera, this);
  registerHybridMethod("createView", &EngineWrapper::createView, this);
  registerHybridMethod("createSwapChain", &EngineWrapper::createSwapChain, this);

  // Custom simplification methods
  registerHybridMethod("createDefaultLight", &EngineWrapper::createDefaultLight, this);
  registerHybridMethod("createCameraManipulator", &EngineWrapper::createCameraManipulator, this);
  registerHybridMethod("loadAsset", &EngineWrapper::loadAsset, this);
}

void EngineWrapper::setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider) {
  _surfaceProvider = surfaceProvider;
  std::shared_ptr<Surface> surface = surfaceProvider->getSurfaceOrNull();
  if (surface != nullptr) {
    setSurface(surface);
  }

  Listener listener = surfaceProvider->addOnSurfaceChangedListener(
      SurfaceProvider::Callback{.onSurfaceCreated = [=](std::shared_ptr<Surface> surface) { this->setSurface(surface); },
                                .onSurfaceDestroyed = [=](std::shared_ptr<Surface> surface) { this->destroySurface(); }});
  _listener = std::make_shared<Listener>(std::move(listener));
}

void EngineWrapper::setSurface(std::shared_ptr<Surface> surface) {
  void* nativeWindow = surface->getSurface();
}

void EngineWrapper::destroySurface() {
  // TODO: Implement, probably from JS layer?
  // if (_swapChain) {
  //   _engine->destroy(_swapChain.get());
  //   _engine->flushAndWait();
  //   _swapChain = nullptr;
  // }
}

std::shared_ptr<RendererWrapper> EngineWrapper::createRenderer() {
  std::shared_ptr<Renderer> renderer = References<Renderer>::adoptEngineRef(
      _engine, _engine->createRenderer(), [](const std::shared_ptr<Engine>& engine, Renderer* renderer) { engine->destroy(renderer); });
  return std::make_shared<RendererWrapper>(renderer);
}

std::shared_ptr<SceneWrapper> EngineWrapper::createScene() {
  std::shared_ptr<Scene> scene = References<Scene>::adoptEngineRef(
      _engine, _engine->createScene(), [](const std::shared_ptr<Engine>& engine, Scene* scene) { engine->destroy(scene); });

  return std::make_shared<SceneWrapper>(scene);
}

std::shared_ptr<CameraWrapper> EngineWrapper::createCamera() {
  std::shared_ptr<Camera> camera = References<Camera>::adoptEngineRef(
      _engine, _engine->createCamera(_engine->getEntityManager().create()),
      [](const std::shared_ptr<Engine>& engine, Camera* camera) { engine->destroyCameraComponent(camera->getEntity()); });

  camera->setExposure(16.0f, 1.0f / 125.0f, 100.0f);
  return std::make_shared<CameraWrapper>(camera);
}

std::shared_ptr<ViewWrapper> EngineWrapper::createView() {
  std::shared_ptr view = References<View>::adoptEngineRef(_engine, _engine->createView(),
                                                          [](const std::shared_ptr<Engine>& engine, View* view) { engine->destroy(view); });

  return std::make_shared<ViewWrapper>(view);
}

std::shared_ptr<SwapChainWrapper> EngineWrapper::createSwapChain(std::shared_ptr<Surface> surface) {
  auto _swapChain = References<SwapChain>::adoptEngineRef(
      _engine, _engine->createSwapChain(surface->getSurface(), SwapChain::CONFIG_TRANSPARENT),
      [](const std::shared_ptr<Engine>& engine, SwapChain* swapChain) { engine->destroy(swapChain); });

  return std::make_shared<SwapChainWrapper>(_swapChain);
}

void EngineWrapper::loadAsset(std::shared_ptr<FilamentBuffer> modelBuffer) {
  filament::gltfio::FilamentAsset* asset = _assetLoader->createAsset(modelBuffer->getData(), modelBuffer->getSize());
  if (asset == nullptr) {
    throw std::runtime_error("Failed to load asset");
  }

  _resourceLoader->loadResources(asset);
  // TODO: animator = asset.instance.animator # add animator!
  asset->releaseSourceData();
}

std::shared_ptr<EntityWrapper> EngineWrapper::createDefaultLight() {
  // Create default directional light (In ModelViewer this is the default, so we use it here as well)
  // TODO: Remove this any make this configurable / expose setExposure to JS
  auto lightEntity = _engine->getEntityManager().create();
  LightManager::Builder(LightManager::Type::DIRECTIONAL)
      .color(Color::cct(6500.0f))
      .intensity(10000)
      .direction({0, -1, 0})
      .castShadows(true)
      .build(*_engine, lightEntity);
  return std::make_shared<EntityWrapper>(lightEntity);
}

std::shared_ptr<ManipulatorWrapper> EngineWrapper::createCameraManipulator(int width, int height) {
  ManipulatorBuilder* builder = new ManipulatorBuilder();
  builder->targetPosition(0.0f, 0.0f, -4.0f); // kDefaultObjectPosition
  builder->viewport(width, height);
  std::shared_ptr<Manipulator<float>> manipulator = std::shared_ptr<Manipulator<float>>(builder->build(Mode::ORBIT));
  return std::make_shared<ManipulatorWrapper>(manipulator);
}

} // namespace margelo