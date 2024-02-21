//
// Created by Marc Rousavy on 21.02.24.
//

#include "EngineWrapper.h"

#include <filament/Engine.h>
#include <filament/SwapChain.h>

namespace margelo {

EngineWrapper::EngineWrapper(filament::Engine::Backend backend) {
  _engine = Engine::create(backend);
}

EngineWrapper::~EngineWrapper() {
  if (_swapChain) {
    _engine->destroy(_swapChain);
  }
  _engine->destroy(&_engine);
}

void EngineWrapper::loadHybridMethods() {
  registerHybridMethod("setSurfaceProvider", &EngineWrapper::setSurfaceProvider, this);
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

} // namespace margelo