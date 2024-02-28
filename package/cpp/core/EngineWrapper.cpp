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

#include <utility>

namespace margelo {

EngineWrapper::EngineWrapper(std::shared_ptr<Choreographer> choreographer) {
  // TODO: make the enum for the backend for the engine configurable
  _engine = References<Engine>::adoptRef(Engine::create(), [](Engine* engine) { Engine::destroy(&engine); });
  _materialProvider = gltfio::createUbershaderProvider(_engine.get(), UBERARCHIVE_DEFAULT_DATA, UBERARCHIVE_DEFAULT_SIZE);
  _assetLoader = gltfio::AssetLoader::create(filament::gltfio::AssetConfiguration{.engine = _engine.get(), .materials = _materialProvider});

  // Setup filament:
  _renderer = createRenderer();
  _scene = createScene();
  _view = createView();
  _camera = createCamera();

  _view->getView()->setScene(_scene->getScene().get());
  _view->getView()->setCamera(_camera->getCamera().get());

  createDefaultLight();

  _choreographer = std::move(choreographer);
}

EngineWrapper::~EngineWrapper() {
  gltfio::AssetLoader::destroy(&_assetLoader);
  _materialProvider->destroyMaterials();
}

void EngineWrapper::loadHybridMethods() {
  registerHybridMethod("setSurfaceProvider", &EngineWrapper::setSurfaceProvider, this);
  registerHybridMethod("setRenderCallback", &EngineWrapper::setRenderCallback, this);

  // Filament API:
  registerHybridMethod("getRenderer", &EngineWrapper::getRenderer, this);
  registerHybridMethod("getScene", &EngineWrapper::getScene, this);
  registerHybridMethod("getView", &EngineWrapper::getView, this);
  registerHybridMethod("getCamera", &EngineWrapper::getCamera, this);
  registerHybridMethod("getCameraManipulator", &EngineWrapper::getCameraManipulator, this);
}

void EngineWrapper::setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider) {
  _surfaceProvider = surfaceProvider;
  std::shared_ptr<Surface> surface = surfaceProvider->getSurfaceOrNull();
  if (surface != nullptr) {
    setSurface(surface);
  }

  Listener listener = surfaceProvider->addOnSurfaceChangedListener(SurfaceProvider::Callback{
      .onSurfaceCreated = [=](std::shared_ptr<Surface> surface) { this->setSurface(surface); },
      .onSurfaceSizeChanged = [=](std::shared_ptr<Surface> surface, int width, int height) { this->surfaceSizeChanged(width, height); },
      .onSurfaceDestroyed = [=](std::shared_ptr<Surface> surface) { this->destroySurface(); }});
  _listener = std::make_shared<Listener>(std::move(listener));
}

void EngineWrapper::setSurface(std::shared_ptr<Surface> surface) {
  // Setup swapchain
  _swapChain = createSwapChain(surface);

  // Setup camera manipulator
  _cameraManipulator = createCameraManipulator(surface->getWidth(), surface->getHeight());

  // Notify about the surface size change
  surfaceSizeChanged(surface->getWidth(), surface->getHeight());

  // Install our render function into the choreographer
  _choreographerListener = _choreographer->addOnFrameListener([this](double timestamp) { this->renderFrame(timestamp); });
  // Start the rendering
  _choreographer->start();
}

void EngineWrapper::surfaceSizeChanged(int width, int height) {
  if (_view) {
    _view->setViewport(0, 0, width, height);
  }
  if (_cameraManipulator) {
    _cameraManipulator->getManipulator()->setViewport(width, height);
  }
  // TODO:
  //    updateCameraProjection()
  //    synchronizePendingFrames(engine)
}

void EngineWrapper::destroySurface() {
  _choreographer->stop();
  _choreographerListener->remove();
  _swapChain = nullptr;
}

void EngineWrapper::setRenderCallback(std::function<void(std::shared_ptr<EngineWrapper>)> callback) {
  _renderCallback = std::move(callback);
}

// This method is connected to the choreographer and gets called every frame,
// once we have a surface.
void EngineWrapper::renderFrame(double timestamp) {
  if (!_swapChain) {
    return;
  }

  if (!_view) {
    return;
  }

  if (_renderCallback) {
    // Call JS callback with scene information
    _renderCallback(nullptr);
  }

  std::shared_ptr<Renderer> renderer = _renderer->getRenderer();
  std::shared_ptr<SwapChain> swapChain = _swapChain->getSwapChain();
  if (renderer->beginFrame(swapChain.get(), timestamp)) {
    std::shared_ptr<FilamentView> view = _view->getView();
    renderer->render(view.get());
    renderer->endFrame();
  }
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

std::shared_ptr<ViewWrapper> EngineWrapper::createView() {
  std::shared_ptr view = References<View>::adoptEngineRef(_engine, _engine->createView(),
                                                          [](const std::shared_ptr<Engine>& engine, View* view) { engine->destroy(view); });

  return std::make_shared<ViewWrapper>(view);
}

std::shared_ptr<SwapChainWrapper> EngineWrapper::createSwapChain(std::shared_ptr<Surface> surface) {
  auto swapChain = References<SwapChain>::adoptEngineRef(
      _engine, _engine->createSwapChain(surface->getSurface(), SwapChain::CONFIG_TRANSPARENT),
      [](const std::shared_ptr<Engine>& engine, SwapChain* swapChain) { engine->destroy(swapChain); });

  return std::make_shared<SwapChainWrapper>(swapChain);
}

std::shared_ptr<CameraWrapper> EngineWrapper::createCamera() {
  std::shared_ptr<Camera> camera = References<Camera>::adoptEngineRef(
      _engine, _engine->createCamera(_engine->getEntityManager().create()),
      [](const std::shared_ptr<Engine>& engine, Camera* camera) { engine->destroyCameraComponent(camera->getEntity()); });

  camera->setExposure(16.0f, 1.0f / 125.0f, 100.0f);
  return std::make_shared<CameraWrapper>(camera);
}

void EngineWrapper::createDefaultLight() {
  // Create default directional light (In ModelViewer this is the default, so we use it here as well)
  auto lightEntity = _engine->getEntityManager().create();
  LightManager::Builder(LightManager::Type::DIRECTIONAL)
      .color(Color::cct(6500.0f))
      .intensity(10000)
      .direction({0, -1, 0})
      .castShadows(true)
      .build(*_engine, lightEntity);

  _scene->getScene()->addEntity(lightEntity);
}

std::shared_ptr<ManipulatorWrapper> EngineWrapper::createCameraManipulator(int width, int height) {
  ManipulatorBuilder* builder = new ManipulatorBuilder();
  builder->targetPosition(0.0f, 0.0f, -4.0f); // kDefaultObjectPosition
  builder->viewport(width, height);
  std::shared_ptr<Manipulator<float>> manipulator = std::shared_ptr<Manipulator<float>>(builder->build(Mode::ORBIT));
  return std::make_shared<ManipulatorWrapper>(manipulator);
}

} // namespace margelo