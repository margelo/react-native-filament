//
// Created by Marc Rousavy on 21.02.24.
//

#include "EngineWrapper.h"

#include "LightEnum.h"
#include "References.h"
#include "utils/Converter.h"

#include <filament/Color.h>
#include <filament/Engine.h>
#include <filament/Fence.h>
#include <filament/IndirectLight.h>
#include <filament/LightManager.h>
#include <filament/RenderableManager.h>
#include <filament/SwapChain.h>
#include <filament/TransformManager.h>
#include <utils/Entity.h>
#include <utils/EntityManager.h>

#include <gltfio/Animator.h>
#include <gltfio/MaterialProvider.h>
#include <gltfio/materials/uberarchive.h>

#include <filament/LightManager.h>
#include <filament/SwapChain.h>
#include <ktxreader/Ktx1Reader.h>
#include <utils/Entity.h>
#include <utils/EntityManager.h>

#include <utility>

namespace margelo {

EngineWrapper::EngineWrapper(std::shared_ptr<Choreographer> choreographer, std::shared_ptr<JSDispatchQueue> jsDispatchQueue) {
  // TODO: make the enum for the backend for the engine configurable
  _jsDispatchQueue = jsDispatchQueue;
  _engine = References<Engine>::adoptRef(Engine::create(), [](Engine* engine) { Engine::destroy(&engine); });

  gltfio::MaterialProvider* _materialProviderPtr =
      gltfio::createUbershaderProvider(_engine.get(), UBERARCHIVE_DEFAULT_DATA, UBERARCHIVE_DEFAULT_SIZE);
  _materialProvider = References<gltfio::MaterialProvider>::adoptEngineRef(
      _engine, _materialProviderPtr, [](const std::shared_ptr<Engine>& engine, gltfio::MaterialProvider* provider) {
        provider->destroyMaterials();
        delete provider;
      });

  gltfio::AssetConfiguration assetConfig{.engine = _engine.get(), .materials = _materialProvider.get()};
  gltfio::AssetLoader* assetLoaderPtr = gltfio::AssetLoader::create(assetConfig);
  _assetLoader = References<gltfio::AssetLoader>::adoptEngineRef(
      _engine, assetLoaderPtr, [](const std::shared_ptr<Engine>& engine, gltfio::AssetLoader* assetLoader) {
        auto* ncm = assetLoader->getNames();
        delete ncm;
        gltfio::AssetLoader::destroy(&assetLoader);
      });

  filament::gltfio::ResourceConfiguration resourceConfig{.engine = _engine.get(), .normalizeSkinningWeights = true};
  auto* resourceLoaderPtr = new filament::gltfio::ResourceLoader(resourceConfig);
  // Add texture providers to the resource loader
  auto stbProvider = filament::gltfio::createStbProvider(_engine.get());
  auto ktx2Provider = filament::gltfio::createKtx2Provider(_engine.get());
  resourceLoaderPtr->addTextureProvider("image/jpeg", stbProvider);
  resourceLoaderPtr->addTextureProvider("image/png", stbProvider);
  resourceLoaderPtr->addTextureProvider("image/ktx2", ktx2Provider);
  _resourceLoader = References<gltfio::ResourceLoader>::adoptEngineRef(
      _engine, resourceLoaderPtr,
      [stbProvider, ktx2Provider](const std::shared_ptr<Engine>& engine, gltfio::ResourceLoader* resourceLoader) {
        delete stbProvider;
        delete ktx2Provider;
        delete resourceLoader;
      });

  // Setup filament:
  _renderer = createRenderer();
  _scene = createScene();
  _view = createView();
  _camera = createCamera();

  _view->getView()->setScene(_scene->getScene().get());
  _view->getView()->setCamera(_camera->getCamera().get());

  _choreographer = std::move(choreographer);
}

void EngineWrapper::loadHybridMethods() {
  registerHybridMethod("setSurfaceProvider", &EngineWrapper::setSurfaceProvider, this);
  registerHybridMethod("setRenderCallback", &EngineWrapper::setRenderCallback, this);
  registerHybridMethod("setIndirectLight", &EngineWrapper::setIndirectLight, this);

  registerHybridMethod("loadAsset", &EngineWrapper::loadAsset, this);

  // Filament API:
  registerHybridMethod("getRenderer", &EngineWrapper::getRenderer, this);
  registerHybridMethod("getScene", &EngineWrapper::getScene, this);
  registerHybridMethod("getView", &EngineWrapper::getView, this);
  registerHybridMethod("getCamera", &EngineWrapper::getCamera, this);
  registerHybridMethod("getCameraManipulator", &EngineWrapper::getCameraManipulator, this);
  registerHybridMethod("createLightEntity", &EngineWrapper::createLightEntity, this);
  registerHybridMethod("transformToUnitCube", &EngineWrapper::transformToUnitCube, this);
  registerHybridMethod("setEntityPosition", &EngineWrapper::setEntityPosition, this);
  registerHybridMethod("setEntityRotation", &EngineWrapper::setEntityRotation, this);
  registerHybridMethod("setEntityScale", &EngineWrapper::setEntityScale, this);
}

void EngineWrapper::setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider) {
  if (surfaceProvider == nullptr) {
    [[unlikely]];
    throw std::runtime_error("SurfaceProvider cannot be null!");
  }
  _surfaceProvider = surfaceProvider;
  std::shared_ptr<Surface> surface = surfaceProvider->getSurfaceOrNull();
  if (surface != nullptr) {
    setSurface(surface);
  }

  auto queue = _jsDispatchQueue;
  auto sharedThis = shared<EngineWrapper>();
  SurfaceProvider::Callback callback{.onSurfaceCreated =
                                         [=](std::shared_ptr<Surface> surface) {
                                           queue->runOnJS([=]() {
                                             Logger::log("Initializing surface...");
                                             sharedThis->setSurface(surface);
                                           });
                                         },
                                     .onSurfaceSizeChanged =
                                         [queue, sharedThis](std::shared_ptr<Surface> surface, int width, int height) {
                                           queue->runOnJS([=]() {
                                             Logger::log("Updating Surface size...");
                                             sharedThis->surfaceSizeChanged(width, height);
                                             sharedThis->synchronizePendingFrames();
                                           });
                                         },
                                     .onSurfaceDestroyed =
                                         [=](std::shared_ptr<Surface> surface) {
                                           queue->runOnJSAndWait([=]() {
                                             Logger::log("Destroying surface...");
                                             sharedThis->destroySurface();
                                           });
                                         }};
  Listener listener = surfaceProvider->addOnSurfaceChangedListener(callback);
  _listener = std::make_shared<Listener>(std::move(listener));
}

void EngineWrapper::setSurface(std::shared_ptr<Surface> surface) {
  Logger::log("Initializing SwapChain...");

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
  if (_cameraManipulator) {
    _cameraManipulator->getManipulator()->setViewport(width, height);
  }
  if (_view) {
    _view->setViewport(0, 0, width, height);
  }

  // TODO: when the surface resizes we need to update the camera projection, but that one is owned by JS now.
  //  updateCameraProjection();
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

  _resourceLoader->asyncUpdateLoad();

  if (_startTime == 0) {
    _startTime = timestamp;
  }

  //  if (_animator) {
  //    if (_animator->getAnimationCount() > 0) {
  //      _animator->applyAnimation(0, (timestamp - _startTime) / 1e9);
  //    }
  //    _animator->updateBoneMatrices();
  //  }

  if (_renderCallback) {
    // Call JS callback with scene information
    _renderCallback(nullptr);
  }

  std::shared_ptr<Renderer> renderer = _renderer->getRenderer();
  std::shared_ptr<SwapChain> swapChain = _swapChain->getSwapChain();
  if (renderer->beginFrame(swapChain.get(), timestamp)) {
    std::shared_ptr<View> view = _view->getView();
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

  const float aperture = 16.0f;
  const float shutterSpeed = 1.0f / 125.0f;
  const float sensitivity = 100.0f;
  camera->setExposure(aperture, shutterSpeed, sensitivity);
  return std::make_shared<CameraWrapper>(camera);
}

std::shared_ptr<FilamentAssetWrapper> EngineWrapper::loadAsset(std::shared_ptr<FilamentBuffer> modelBuffer) {
  std::shared_ptr<ManagedBuffer> buffer = modelBuffer->getBuffer();
  gltfio::FilamentAsset* asset = _assetLoader->createAsset(buffer->getData(), buffer->getSize());
  if (asset == nullptr) {
    throw std::runtime_error("Failed to load asset");
  }

  if (!_scene) {
    throw std::runtime_error("Scene not initialized");
  }

  // TODO: When supporting loading glTF files with external resources, we need to load the resources here
  //    const char* const* const resourceUris = asset->getResourceUris();
  //    const size_t resourceUriCount = asset->getResourceUriCount();

  _scene->getScene()->addEntities(asset->getEntities(), asset->getEntityCount());
  _resourceLoader->loadResources(asset);
  _animator = asset->getInstance()->getAnimator();
  asset->releaseSourceData();

  auto assetLoader = _assetLoader;
  auto sharedPtr =
      References<gltfio::FilamentAsset>::adoptRef(asset, [assetLoader](gltfio::FilamentAsset* asset) { assetLoader->destroyAsset(asset); });
  return std::make_shared<FilamentAssetWrapper>(sharedPtr);
}

// Default light is a directional light for shadows + a default IBL
void EngineWrapper::setIndirectLight(std::shared_ptr<FilamentBuffer> iblBuffer) {
  if (!_scene) {
    throw std::runtime_error("Scene not initialized");
  }
  if (!iblBuffer) {
    throw std::runtime_error("IBL buffer is null");
  }
  auto buffer = iblBuffer->getBuffer();
  if (buffer->getSize() == 0) {
    throw std::runtime_error("IBL buffer is empty");
  }

  auto* iblBundle = new image::Ktx1Bundle(buffer->getData(), buffer->getSize());
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
}

std::shared_ptr<EntityWrapper> EngineWrapper::createLightEntity(std::string lightTypeStr, double colorFahrenheit, double intensity,
                                                                double directionX, double directionY, double directionZ, bool castShadows) {
  auto lightEntity = _engine->getEntityManager().create();

  // TODO(Marc): Fix enum converter
  LightManager::Type lightType;
  EnumMapper::convertJSUnionToEnum(lightTypeStr, &lightType);

  LightManager::Builder(lightType)
      .color(Color::cct(static_cast<float>(colorFahrenheit)))
      .intensity(static_cast<float>(intensity))
      .direction({directionX, directionY, directionZ})
      .castShadows(castShadows)
      .build(*_engine, lightEntity);
  return std::make_shared<EntityWrapper>(lightEntity);
}

std::shared_ptr<ManipulatorWrapper> EngineWrapper::createCameraManipulator(int width, int height) {
  ManipulatorBuilder builder;
  // Position of the camera:
  builder.orbitHomePosition(defaultCameraPosition.x, defaultCameraPosition.y, defaultCameraPosition.z);
  // Position the camera points to:
  builder.targetPosition(defaultObjectPosition.x, defaultObjectPosition.y, defaultObjectPosition.z);
  builder.viewport(width, height);
  std::shared_ptr<Manipulator<float>> manipulator = std::shared_ptr<Manipulator<float>>(builder.build(Mode::ORBIT));
  return std::make_shared<ManipulatorWrapper>(manipulator);
}

/**
 * Sets up a root transform on the current model to make it fit into a unit cube.
 */
void EngineWrapper::transformToUnitCube(std::shared_ptr<FilamentAssetWrapper> asset) {
  TransformManager& tm = _engine->getTransformManager();
  asset->transformToUnitCube(tm);
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

/**
 * Internal method that will help updating the transform of an entity.
 * @param transform The transform matrix to apply
 * @param entity The entity to apply the transform to
 * @param multiplyCurrent If true, the current transform will be multiplied with the new transform, otherwise it will be replaced
 */
void EngineWrapper::updateTransform(math::mat4 transform, std::shared_ptr<EntityWrapper> entity, bool multiplyCurrent) {
  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  TransformManager& tm = _engine->getTransformManager();
  EntityInstance<TransformManager> entityInstance = tm.getInstance(entity->getEntity());
  auto currentTransform = tm.getTransform(entityInstance);
  auto newTransform = multiplyCurrent ? (currentTransform * transform) : transform;
  tm.setTransform(entityInstance, newTransform);
}

// TODO(Marc): Ideally i want to do this in the entity wrapper, but i dont have access to the transform manager there
void EngineWrapper::setEntityPosition(std::shared_ptr<EntityWrapper> entity, std::vector<double> positionVec, bool multiplyCurrent) {
  math::float3 position = Converter::VecToFloat3(positionVec);
  auto translationMatrix = math::mat4::translation(position);
  updateTransform(translationMatrix, entity, multiplyCurrent);
}

void EngineWrapper::setEntityRotation(std::shared_ptr<EntityWrapper> entity, double angleRadians, std::vector<double> axisVec,
                                      bool multiplyCurrent) {
  math::float3 axis = Converter::VecToFloat3(axisVec);
  auto rotationMatrix = math::mat4::rotation(angleRadians, axis);
  updateTransform(rotationMatrix, entity, multiplyCurrent);
}

void EngineWrapper::setEntityScale(std::shared_ptr<EntityWrapper> entity, std::vector<double> scaleVec, bool multiplyCurrent) {
  math::float3 scale = Converter::VecToFloat3(scaleVec);
  auto scaleMatrix = math::mat4::scaling(scale);
  updateTransform(scaleMatrix, entity, multiplyCurrent);
}

} // namespace margelo
