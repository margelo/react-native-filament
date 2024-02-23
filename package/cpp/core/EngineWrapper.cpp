//
// Created by Marc Rousavy on 21.02.24.
//

#include "EngineWrapper.h"

#include <filament/Engine.h>
#include <filament/SwapChain.h>
#include <utils/EntityManager.h>

#include <gltfio/MaterialProvider.h>
#include <gltfio/materials/uberarchive.h>

namespace margelo {

EngineWrapper::EngineWrapper() {
  _engine = Engine::create();
  _materialProvider = filament::gltfio::createUbershaderProvider(_engine, UBERARCHIVE_DEFAULT_DATA, UBERARCHIVE_DEFAULT_SIZE);
  _assetLoader = filament::gltfio::AssetLoader::create(filament::gltfio::AssetConfiguration{.engine = _engine, .materials = _materialProvider});
}

EngineWrapper::~EngineWrapper() {
  if (_swapChain) {
    _engine->destroy(_swapChain);
  }
  _assetLoader->destroy(&_assetLoader);
  _materialProvider->destroyMaterials();
  _engine->destroy(&_engine);
}

void EngineWrapper::loadHybridMethods() {
  registerHybridMethod("setSurfaceProvider", &EngineWrapper::setSurfaceProvider, this);
  registerHybridMethod("createRenderer", &EngineWrapper::createRenderer, this);
  registerHybridMethod("createScene", &EngineWrapper::createScene, this);
  registerHybridMethod("createCamera", &EngineWrapper::createCamera, this);
  registerHybridMethod("createView", &EngineWrapper::createView, this);
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
  _listener = std::make_unique<Listener>(std::move(listener));
}

void EngineWrapper::setSurface(std::shared_ptr<Surface> surface) {
  void* nativeWindow = surface->getSurface();
  if (_swapChain == nullptr || _swapChain->getNativeWindow() != nativeWindow) {
    destroySurface();
    _swapChain = _engine->createSwapChain(nativeWindow);
  }
}

void EngineWrapper::destroySurface() {
  if (_swapChain != nullptr) {
    _engine->destroy(_swapChain);
    _swapChain = nullptr;
  }
}

std::shared_ptr<RendererWrapper> EngineWrapper::createRenderer() {
  return std::make_shared<RendererWrapper>(_engine->createRenderer());
}

std::shared_ptr<SceneWrapper> EngineWrapper::createScene() {
  return std::make_shared<SceneWrapper>(_engine->createScene());
}

std::shared_ptr<CameraWrapper> EngineWrapper::createCamera() {
  Camera* camera = _engine->createCamera(_engine->getEntityManager().create());
  // TODO: make this configurable / expose setExposure to JS
  camera->setExposure(16.0f, 1.0f / 125.0f, 100.0f);
  return std::make_shared<CameraWrapper>(camera);
}

std::shared_ptr<ViewWrapper> EngineWrapper::createView() {
  return std::make_shared<ViewWrapper>(_engine->createView());
}

} // namespace margelo