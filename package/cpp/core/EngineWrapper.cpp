//
// Created by Marc Rousavy on 21.02.24.
//

#include "EngineWrapper.h"

#include "References.h"
#include <filament/Color.h>
#include <filament/Engine.h>
#include <filament/IndirectLight.h>
#include <filament/LightManager.h>
#include <filament/SwapChain.h>
#include <filament/TransformManager.h>
#include <filament/Fence.h>
#include <filament/RenderableManager.h>
#include <utils/Entity.h>
#include <utils/EntityManager.h>

#include <gltfio/MaterialProvider.h>
#include <gltfio/materials/uberarchive.h>

#include <ktxreader/Ktx1Reader.h>
#include <utility>

namespace margelo {

EngineWrapper::EngineWrapper(std::shared_ptr<Choreographer> choreographer) {
  // TODO: make the enum for the backend for the engine configurable
  _engine = References<Engine>::adoptRef(Engine::create(), [](Engine* engine) { Engine::destroy(&engine); });
  _materialProvider = gltfio::createUbershaderProvider(_engine.get(), UBERARCHIVE_DEFAULT_DATA, UBERARCHIVE_DEFAULT_SIZE);
  _assetLoader = gltfio::AssetLoader::create(filament::gltfio::AssetConfiguration{.engine = _engine.get(), .materials = _materialProvider});
  _resourceLoader = new filament::gltfio::ResourceLoader({.engine = _engine.get(), .normalizeSkinningWeights = true});
  // Add texture providers to the resource loader
  auto stbProvider = filament::gltfio::createStbProvider(_engine.get());
  auto ktx2Provider = filament::gltfio::createKtx2Provider(_engine.get());
  _resourceLoader->addTextureProvider("image/jpeg", stbProvider);
  _resourceLoader->addTextureProvider("image/png", stbProvider);
  _resourceLoader->addTextureProvider("image/ktx2", ktx2Provider);

  // Setup filament:
  _renderer = createRenderer();
  _scene = createScene();
  _view = createView();
  _camera = createCamera();

  _view->getView()->setScene(_scene->getScene().get());
  _view->getView()->setCamera(_camera->getCamera().get());

  _choreographer = std::move(choreographer);
}

EngineWrapper::~EngineWrapper() {
  gltfio::AssetLoader::destroy(&_assetLoader);
  _materialProvider->destroyMaterials();
}

void EngineWrapper::loadHybridMethods() {
  registerHybridMethod("setSurfaceProvider", &EngineWrapper::setSurfaceProvider, this);
  registerHybridMethod("setRenderCallback", &EngineWrapper::setRenderCallback, this);
  registerHybridMethod("createDefaultLight", &EngineWrapper::createDefaultLight, this);

  registerHybridMethod("loadAsset", &EngineWrapper::loadAsset, this);

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
      .onSurfaceSizeChanged = [=](std::shared_ptr<Surface> surface, int width, int height) {
        this->surfaceSizeChanged(width, height);
        this->synchronizePendingFrames();
      },
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

//  updateCameraProjection();
}

void EngineWrapper::destroySurface() {
  _choreographer->stop();
  _choreographerListener->remove();

  if (_swapChain->getSwapChain()) {
    _engine->destroy(_swapChain->getSwapChain().get());
    _engine->flushAndWait();
    _swapChain = nullptr;
  }
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

  _resourceLoader->asyncUpdateLoad();

  populateScene();

  if (_renderCallback) {
    _renderCallback(nullptr);
  }

  if (_renderer->getRenderer()->beginFrame(_swapChain->getSwapChain().get(), timestamp)) {
    _renderer->getRenderer()->render(_view->getView().get());
    _renderer->getRenderer()->endFrame();
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

void EngineWrapper::loadAsset(std::shared_ptr<FilamentBuffer> modelBuffer) {
  filament::gltfio::FilamentAsset* asset = _assetLoader->createAsset(modelBuffer->getData(), modelBuffer->getSize());
  if (asset == nullptr) {
    throw std::runtime_error("Failed to load asset");
  }

  if (!_scene) {
    throw std::runtime_error("Scene not initialized");
  }

  // TODO: When supporting loading glTF files with external resources, we need to load the resources here
  //    const char* const* const resourceUris = asset->getResourceUris();
  //    const size_t resourceUriCount = asset->getResourceUriCount();

  _assets.push_back(asset);
  _resourceLoader->asyncBeginLoad(asset);
  // TODO: animator = asset.instance.animator # add animator!
  asset->releaseSourceData();

  transformToUnitCube(asset);
}

// Default light is a directional light for shadows + a default IBL
void EngineWrapper::createDefaultLight(std::shared_ptr<FilamentBuffer> iblBuffer) {
  if (!_scene) {
    throw std::runtime_error("Scene not initialized");
  }
  if (!iblBuffer) {
    throw std::runtime_error("IBL buffer is null");
  }
  if (iblBuffer->getSize() == 0) {
    throw std::runtime_error("IBL buffer is empty");
  }

  auto* iblBundle = new image::Ktx1Bundle(iblBuffer->getData(), iblBuffer->getSize());

  Texture* cubemap = ktxreader::Ktx1Reader::createTexture(
      _engine.get(), *iblBundle, false,
      [](void* userdata) {
        auto* bundle = (image::Ktx1Bundle*)userdata;
        delete bundle;
      },
      iblBundle);

  math::float3 harmonics[9];
  iblBundle->getSphericalHarmonics(harmonics);

  IndirectLight* _indirectLight =
      IndirectLight::Builder().reflections(cubemap).irradiance(3, harmonics).intensity(30000.0f).build(*_engine);

  _scene->getScene()->setIndirectLight(_indirectLight);

  // Add directional light for supporting shadows
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
  auto* builder = new ManipulatorBuilder();
  builder->targetPosition(defaultObjectPositionX, defaultObjectPositionY, defaultObjectPositionZ);
  builder->viewport(width, height);
  std::shared_ptr<Manipulator<float>> manipulator = std::shared_ptr<Manipulator<float>>(builder->build(Mode::ORBIT));
  return std::make_shared<ManipulatorWrapper>(manipulator);
}

/**
 * Sets up a root transform on the current model to make it fit into a unit cube.
 */
void EngineWrapper::transformToUnitCube(filament::gltfio::FilamentAsset* asset) {
  TransformManager& tm = _engine->getTransformManager();
  Aabb aabb = asset->getBoundingBox();
  math::details::TVec3<float> center = aabb.center();
  math::details::TVec3<float> halfExtent = aabb.extent();
  float maxExtent = max(halfExtent) * 2.0f;
  float scaleFactor = 2.0f / maxExtent;
  center -= center / scaleFactor;
  math::mat4f transform = math::mat4f::scaling(scaleFactor) * math::mat4f::translation(-center);
  tm.setTransform(tm.getInstance(asset->getRoot()), transpose(transform));
}

void EngineWrapper::updateCameraProjection() {
  if (!_view) {
        throw std::runtime_error("View not initialized");
  }
  if (!_camera) {
        throw std::runtime_error("Camera not initialized");
  }

  double aspect = _view->getView()->getViewport().width / _view->getView()->getViewport().height;
  float focalLength = 28.0f;
  float near = 0.05f; // 5cm
  float far = 1000.0f; // 1km
  _camera->getCamera()->setLensProjection(focalLength, aspect, near, far);

}
void EngineWrapper::synchronizePendingFrames() {
  if (!_engine) {
    throw std::runtime_error("Engine not initialized");
  }
  // Wait for all pending frames to be processed before returning. This is to
  // avoid a race between the surface being resized before pending frames are
  // rendered into it.
  Fence* fence = _engine->createFence();
  fence->wait(Fence::Mode::FLUSH, Fence::FENCE_WAIT_FOR_EVER);
  _engine->destroy(fence);
}
void EngineWrapper::populateScene() {
  RenderableManager& rcm = _engine->getRenderableManager();
  for (auto asset : _assets) {
    std::vector<utils::Entity> readyRenderables;

    // Assuming a reasonable maximum number of renderables to avoid dynamic allocation.
    const size_t maxRenderables = 128;
    utils::Entity tempRenderables[maxRenderables];
    size_t count = 0;

    // Function to populate renderables
    auto popRenderables = [&]() -> bool {
      count = asset->popRenderables(tempRenderables, maxRenderables);
      readyRenderables.assign(tempRenderables, tempRenderables + count);
      return count != 0;
    };

    while (popRenderables()) {
      for (size_t i = 0; i < count; ++i) {
        auto ri = rcm.getInstance(readyRenderables[i]);
        if (ri) {
          rcm.setScreenSpaceContactShadows(ri, true);
        }
      }
      _scene->getScene()->addEntities(tempRenderables, count);
    }

    // Add light entities to the scene
    size_t lightEntityCount = asset->getLightEntityCount();
    if (lightEntityCount > 0) {
      const auto& lightEntities = asset->getLightEntities();
      _scene->getScene()->addEntities(lightEntities, lightEntityCount);
    }
  }
}

} // namespace margelo