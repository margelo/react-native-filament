//
// Created by Marc Rousavy on 21.02.24.
//

#include "EngineImpl.h"

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

#include <ktxreader/Ktx1Reader.h>

#include <unistd.h>
#include <utility>

namespace margelo {

EngineImpl::EngineImpl(std::shared_ptr<Choreographer> choreographer, std::shared_ptr<Dispatcher> rendererDispatcher,
                       std::shared_ptr<Engine> engine)
    : _engine(engine), _rendererDispatcher(rendererDispatcher), _choreographer(choreographer) {

  gltfio::MaterialProvider* _materialProviderPtr =
      gltfio::createUbershaderProvider(engine.get(), UBERARCHIVE_DEFAULT_DATA, UBERARCHIVE_DEFAULT_SIZE);
  _materialProvider = References<gltfio::MaterialProvider>::adoptEngineRef(
      engine, _materialProviderPtr, [](std::shared_ptr<Engine> engine, gltfio::MaterialProvider* provider) {
        Logger::log(TAG, "Destroying material provider...");
        // Note: The materials of the provider are getting destroyed when the scene is destroyed,
        delete provider;
      });

  EntityManager& entityManager = engine->getEntityManager();
  NameComponentManager* ncm = new NameComponentManager(entityManager);
  gltfio::AssetConfiguration assetConfig{.engine = engine.get(), .materials = _materialProvider.get(), .names = ncm};
  gltfio::AssetLoader* assetLoaderPtr = gltfio::AssetLoader::create(assetConfig);
  _assetLoader = References<gltfio::AssetLoader>::adoptEngineRef(
      engine, assetLoaderPtr, [ncm, rendererDispatcher](std::shared_ptr<Engine> engine, gltfio::AssetLoader* assetLoader) {
        rendererDispatcher->runAsync([ncm, assetLoader]() {
          Logger::log(TAG, "Destroying asset loader...");
          delete ncm;
          gltfio::AssetLoader::destroy(const_cast<gltfio::AssetLoader**>(&assetLoader));
        });
      });

  filament::gltfio::ResourceConfiguration resourceConfig{.engine = engine.get(), .normalizeSkinningWeights = true};
  auto* resourceLoaderPtr = new filament::gltfio::ResourceLoader(resourceConfig);
  // Add texture providers to the resource loader
  auto* stbProvider = filament::gltfio::createStbProvider(engine.get());
  auto* ktx2Provider = filament::gltfio::createKtx2Provider(engine.get());
  resourceLoaderPtr->addTextureProvider("image/jpeg", stbProvider);
  resourceLoaderPtr->addTextureProvider("image/png", stbProvider);
  resourceLoaderPtr->addTextureProvider("image/ktx2", ktx2Provider);

  _resourceLoader = References<gltfio::ResourceLoader>::adoptEngineRef(
      engine, resourceLoaderPtr,
      [stbProvider, ktx2Provider, rendererDispatcher](std::shared_ptr<Engine> engine, gltfio::ResourceLoader* resourceLoader) {
        Logger::log(TAG, "Destroying resource loader...");
        resourceLoader->evictResourceData();
        delete resourceLoader;
        delete stbProvider;
        delete ktx2Provider;
      });

  // Setup filament:
  _renderer = createRenderer();
  _scene = createScene();
  _view = createView();
  _camera = createCamera();

  _view->setScene(_scene.get());
  _view->setCamera(_camera.get());
}

EngineImpl::~EngineImpl() {
  if (_choreographer) {
    // It can happen that the onSurfaceDestroyed callback wasn't called (yet)
    // but we cleanup the listener when the EngineImpl instance goes out of scope.
    // In this case the Choreographer is still running and we need to stop it.
    _choreographer->stop();
  }
}

void EngineImpl::setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider) {
  if (surfaceProvider == nullptr) {
    [[unlikely]];
    throw std::runtime_error("SurfaceProvider cannot be null!");
  }
  _surfaceProvider = surfaceProvider; // Hold a reference to avoid it getting destroyed
  std::shared_ptr<Surface> surface = surfaceProvider->getSurfaceOrNull();
  if (surface != nullptr) {
    setSurface(surface);
  }

  auto dispatcher = _rendererDispatcher;
  std::weak_ptr<EngineImpl> weakSelf = shared_from_this();
  SurfaceProvider::Callback callback{.onSurfaceCreated =
                                         [dispatcher, weakSelf](std::shared_ptr<Surface> surface) {
                                           dispatcher->runAsync([=]() {
                                             auto sharedThis = weakSelf.lock();
                                             if (sharedThis != nullptr) {
                                               Logger::log(TAG, "Initializing surface...");
                                               sharedThis->setSurface(surface);
                                             }
                                           });
                                         },
                                     .onSurfaceSizeChanged =
                                         [dispatcher, weakSelf](std::shared_ptr<Surface> surface, int width, int height) {
                                           dispatcher->runAsync([=]() {
                                             auto sharedThis = weakSelf.lock();
                                             if (sharedThis != nullptr) {
                                               std::unique_lock lock(sharedThis->_mutex);
                                               Logger::log(TAG, "Updating Surface size...");
                                               sharedThis->surfaceSizeChanged(width, height);
                                               sharedThis->synchronizePendingFrames();
                                             }
                                           });
                                         },
                                     .onSurfaceDestroyed =
                                         [dispatcher, weakSelf](std::shared_ptr<Surface> surface) {
                                           auto sharedThis = weakSelf.lock();
                                           if (sharedThis != nullptr) {
                                             sharedThis->destroySurface();
                                           }
                                         }};
  _surfaceListener = surfaceProvider->addOnSurfaceChangedListener(std::move(callback));
}

void EngineImpl::setSurface(std::shared_ptr<Surface> surface) {
  std::unique_lock lock(_mutex);
  Logger::log(TAG, "Initializing SwapChain...");

  // Setup swapchain
  _swapChain = createSwapChain(surface);

  // Setup camera manipulator
  _cameraManipulator = createCameraManipulator(surface->getWidth(), surface->getHeight());

  // Notify about the surface size change
  surfaceSizeChanged(surface->getWidth(), surface->getHeight());

  // Install our render function into the choreographer
  if (_choreographerListener) {
    // If a previous listener was attached, remove it
    _choreographerListener->remove();
  }
  std::weak_ptr<EngineImpl> weakSelf = shared_from_this();
  _choreographerListener = _choreographer->addOnFrameListener([weakSelf](double timestamp) {
    auto sharedThis = weakSelf.lock();
    if (sharedThis != nullptr) {
      sharedThis->renderFrame(timestamp);
    }
  });

  if (!_isPaused) {
    // Start the rendering
    Logger::log(TAG, "Successfully created SwapChain, starting choreographer!");
    _choreographer->start();
  } else {
    Logger::log(TAG, "Successfully created SwapChain, but rendering is paused!");
  }
}

void EngineImpl::surfaceSizeChanged(int width, int height) {
  if (width <= 0 || height <= 0) {
    Logger::log(TAG, "(surfaceSizeChanged) Ignoring invalid surface size: %d x %d", width, height);
    return;
  }

  if (_cameraManipulator) {
    Logger::log(TAG, "(surfaceSizeChanged) Updating viewport size to %d x %d", width, height);
    _cameraManipulator->getManipulator()->setViewport(width, height);
  }
  if (_view) {
    _view->setViewport({0, 0, static_cast<uint32_t>(width), static_cast<uint32_t>(height)});
  }
}

void EngineImpl::destroySurface() {
  if (_swapChain == nullptr) {
    // Surface is already destroyed / never existed.
    return;
  }

  _choreographer->stop();
  if (_choreographerListener) {
    _choreographerListener->remove();
    _choreographerListener = nullptr;
  }

  _swapChain = nullptr;
}

void EngineImpl::setIsPaused(bool isPaused) {
  std::unique_lock lock(_mutex);

  _isPaused = isPaused;
  if (isPaused) {
    _choreographer->stop();
  } else {
    _choreographer->start();
  }
}

void EngineImpl::setRenderCallback(std::optional<RenderCallback> callback) {
  std::unique_lock lock(_mutex);

  if (callback.has_value()) {
    Logger::log(TAG, "Setting render callback");
  } else {
    Logger::log(TAG, "Removing render callback");
  }

  _renderCallback = callback;
}

// This will be called when the runtime that created the EngineImpl gets destroyed.
// The same runtime/thread that creates the EngineImpl is the one the renderCallback
// jsi::Function has been created on, and needs to be destroyed on.
// Additionally we want to stop and release the choreographer listener, so there is no
// risk of it being called (and then calling the renderCallback which is invalid by then).
void EngineImpl::onRuntimeDestroyed(jsi::Runtime*) {
  std::unique_lock lock(_mutex);
  Logger::log(TAG, "Runtime destroyed, stopping renderer...");
  _renderCallback = nullptr;
  _choreographer->stop();
  if (_choreographerListener) {
    _choreographerListener->remove();
    _choreographerListener = nullptr;
  }
}

// This method is connected to the choreographer and gets called every frame,
// once we have a surface.
void EngineImpl::renderFrame(double timestamp) {
  std::unique_lock lock(_mutex);

  if (!_swapChain) {
    [[unlikely]];
    return;
  }
  if (!_view) {
    [[unlikely]];
    return;
  }

  _resourceLoader->asyncUpdateLoad();

  if (_startTime == 0) {
    _startTime = timestamp;
  }

  if (_renderCallback.has_value()) {
    [[likely]];
    const auto& renderCallback = _renderCallback.value();
    // Call JS callback with scene information
    double passedSeconds = (timestamp - _startTime) / 1e9;
    renderCallback(timestamp, _startTime, passedSeconds);
  }

  if (_renderer->beginFrame(_swapChain.get(), timestamp)) {
    [[likely]];
    _renderer->render(_view.get());
    _renderer->endFrame();
  }
}

std::shared_ptr<Renderer> EngineImpl::createRenderer() {
  auto dispatcher = _rendererDispatcher;
  std::shared_ptr<Renderer> renderer = References<Renderer>::adoptEngineRef(
      _engine, _engine->createRenderer(), [dispatcher](std::shared_ptr<Engine> engine, Renderer* renderer) {
        dispatcher->runAsync([engine, renderer]() {
          Logger::log(TAG, "Destroying renderer...");
          engine->destroy(renderer);
        });
      });
  renderer->setClearOptions({.clear = true});
  return renderer;
}

std::shared_ptr<Scene> EngineImpl::createScene() {
  auto materialProvider = _materialProvider;
  auto dispatcher = _rendererDispatcher;
  std::shared_ptr<Scene> scene = References<Scene>::adoptEngineRef(
      _engine, _engine->createScene(), [materialProvider, dispatcher](std::shared_ptr<Engine> engine, Scene* scene) {
        dispatcher->runAsync([materialProvider, engine, scene]() {
          Logger::log(TAG, "Destroying scene...");
          // Destroy all materials that were created by the material provider
          materialProvider->destroyMaterials();
          engine->destroy(scene);
        });
      });

  return scene;
}

std::shared_ptr<View> EngineImpl::createView() {
  auto dispatcher = _rendererDispatcher;
  std::shared_ptr view =
      References<View>::adoptEngineRef(_engine, _engine->createView(), [dispatcher](std::shared_ptr<Engine> engine, View* view) {
        dispatcher->runAsync([engine, view]() {
          Logger::log(TAG, "Destroying view...");
          engine->destroy(view);
        });
      });

  return view;
}

std::shared_ptr<SwapChain> EngineImpl::createSwapChain(std::shared_ptr<Surface> surface) {
  auto dispatcher = _rendererDispatcher;
  void* nativeWindow = surface->getSurface();
  auto swapChain = References<SwapChain>::adoptEngineRef(_engine, _engine->createSwapChain(nativeWindow, SwapChain::CONFIG_TRANSPARENT),
                                                         [dispatcher](std::shared_ptr<Engine> engine, SwapChain* swapChain) {
                                                           dispatcher->runAsync([engine, swapChain]() {
                                                             Logger::log(TAG, "Destroying swapchain...");
                                                             engine->destroy(swapChain);
                                                             // Required to ensure we don't return before Filament is done executing the
                                                             // destroySwapChain command, otherwise Android might destroy the Surface
                                                             // too early
                                                             engine->flushAndWait();
                                                             Logger::log(TAG, "Destroyed swapchain!");
                                                           });
                                                         });

  return swapChain;
}

std::shared_ptr<Camera> EngineImpl::createCamera() {
  auto dispatcher = _rendererDispatcher;
  std::shared_ptr<Camera> camera = References<Camera>::adoptEngineRef(_engine, _engine->createCamera(_engine->getEntityManager().create()),
                                                                      [dispatcher](std::shared_ptr<Engine> engine, Camera* camera) {
                                                                        dispatcher->runAsync([engine, camera]() {
                                                                          Logger::log(TAG, "Destroying camera...");
                                                                          EntityManager::get().destroy(camera->getEntity());
                                                                          engine->destroyCameraComponent(camera->getEntity());
                                                                        });
                                                                      });

  const float aperture = 16.0f;
  const float shutterSpeed = 1.0f / 125.0f;
  const float sensitivity = 100.0f;
  camera->setExposure(aperture, shutterSpeed, sensitivity);
  return camera;
}

std::shared_ptr<FilamentAssetWrapper> EngineImpl::loadAsset(std::shared_ptr<FilamentBuffer> modelBuffer) {
  std::unique_lock lock(_mutex);
  std::shared_ptr<ManagedBuffer> buffer = modelBuffer->getBuffer();
  gltfio::FilamentAsset* assetPtr = _assetLoader->createAsset(buffer->getData(), buffer->getSize());

  return makeAssetWrapper(assetPtr);
}

std::shared_ptr<FilamentAssetWrapper> EngineImpl::loadInstancedAsset(std::shared_ptr<FilamentBuffer> modelBuffer, int instanceCount) {
  std::unique_lock lock(_mutex);
  std::shared_ptr<ManagedBuffer> buffer = modelBuffer->getBuffer();
  FilamentInstance* instances[instanceCount]; // Memory managed by the FilamentAsset
  gltfio::FilamentAsset* assetPtr = _assetLoader->createInstancedAsset(buffer->getData(), buffer->getSize(), instances, instanceCount);

  return makeAssetWrapper(assetPtr);
}

std::shared_ptr<FilamentAssetWrapper> EngineImpl::makeAssetWrapper(FilamentAsset* assetPtr) {
  if (assetPtr == nullptr) {
    throw std::runtime_error("Failed to load asset");
  }

  auto assetLoader = _assetLoader;
  auto dispatcher = _rendererDispatcher;
  auto scene = _scene;
  std::shared_ptr<EngineImpl> sharedThis = shared_from_this();
  auto asset =
      References<gltfio::FilamentAsset>::adoptRef(assetPtr, [dispatcher, assetLoader, scene, sharedThis](gltfio::FilamentAsset* asset) {
        dispatcher->runAsync([assetLoader, asset, scene, sharedThis]() {
          std::unique_lock lock(sharedThis->_mutex); // Locking here, so we don't call render while destroying the asset
          Logger::log(TAG, "Destroying asset...");
          scene->removeEntities(asset->getEntities(), asset->getEntityCount());
          assetLoader->destroyAsset(asset);
        });
      });

  // TODO: When supporting loading glTF files with external resources, we need to load the resources here
  //    const char* const* const resourceUris = asset->getResourceUris();
  //    const size_t resourceUriCount = asset->getResourceUriCount();
  _resourceLoader->loadResources(asset.get());

  return std::make_shared<FilamentAssetWrapper>(asset);
}

// Default light is a directional light for shadows + a default IBL
void EngineImpl::setIndirectLight(std::shared_ptr<FilamentBuffer> iblBuffer, std::optional<double> intensity,
                                  std::optional<int> irradianceBands) {
  std::unique_lock lock(_mutex);
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

  IndirectLight::Builder builder = IndirectLight::Builder().reflections(cubemap);
  if (intensity.has_value()) {
    builder.intensity(static_cast<float>(intensity.value()));
  }
  if (irradianceBands.has_value()) {
    builder.irradiance(static_cast<uint8_t>(irradianceBands.value()), harmonics);
  } else {
    builder.irradiance(3, harmonics);
  }

  IndirectLight* _indirectLight = builder.build(*_engine);
  _scene->setIndirectLight(_indirectLight);
}

std::shared_ptr<ManipulatorWrapper> EngineImpl::createCameraManipulator(int width, int height) {
  ManipulatorBuilder builder;
  // Position of the camera:
  builder.orbitHomePosition(defaultCameraPosition.x, defaultCameraPosition.y, defaultCameraPosition.z);
  // Position the camera points to:
  builder.targetPosition(defaultObjectPosition.x, defaultObjectPosition.y, defaultObjectPosition.z);
  builder.viewport(width, height);
  std::shared_ptr<Manipulator<float>> manipulator = std::shared_ptr<Manipulator<float>>(builder.build(Mode::ORBIT));
  return std::make_shared<ManipulatorWrapper>(manipulator);
}

std::shared_ptr<TransformManagerWrapper> EngineImpl::createTransformManager() {
  std::unique_lock lock(_mutex);
  std::shared_ptr<TransformManagerImpl> transformManagerImpl = std::make_shared<TransformManagerImpl>(_engine);
  return std::make_shared<TransformManagerWrapper>(transformManagerImpl);
}

void EngineImpl::synchronizePendingFrames() {
  // Wait for all pending frames to be processed before returning. This is to
  // avoid a race between the surface being resized before pending frames are
  // rendered into it.
  Fence* fence = _engine->createFence();
  fence->wait(Fence::Mode::FLUSH, Fence::FENCE_WAIT_FOR_EVER);
  _engine->destroy(fence);
}

std::shared_ptr<RenderableManagerWrapper> EngineImpl::createRenderableManager() {
  std::unique_lock lock(_mutex);
  std::shared_ptr<RenderableManagerImpl> renderableManagerImpl = std::make_shared<RenderableManagerImpl>(_engine, _rendererDispatcher);
  return std::make_shared<RenderableManagerWrapper>(renderableManagerImpl);
}

std::shared_ptr<MaterialWrapper> EngineImpl::createMaterial(std::shared_ptr<FilamentBuffer> materialBuffer) {
  std::unique_lock lock(_mutex);
  auto buffer = materialBuffer->getBuffer();
  if (buffer->getSize() == 0) {
    throw std::runtime_error("Material buffer is empty");
  }

  auto sharedThis = shared_from_this();
  auto dispatcher = _rendererDispatcher;
  Material::Builder builder = Material::Builder().package(buffer->getData(), buffer->getSize());
  std::shared_ptr<Material> material = References<Material>::adoptEngineRef(
      _engine, builder.build(*_engine), [dispatcher, sharedThis](std::shared_ptr<Engine> engine, Material* material) {
        dispatcher->runAsync([engine, material, sharedThis]() {
          std::unique_lock lock(sharedThis->_mutex);
          Logger::log(TAG, "Destroying material...");
          engine->destroy(material);
        });
      });

  std::shared_ptr<MaterialImpl> materialImpl = References<MaterialImpl>::adoptEngineRef(
      _engine, new MaterialImpl(material), [dispatcher, sharedThis](std::shared_ptr<Engine> engine, MaterialImpl* pMaterialImpl) {
        dispatcher->runAsync([engine, pMaterialImpl, sharedThis]() {
          Logger::log(TAG, "Destroying MaterialImpl / all material instances...");

          // Iterate over materialWrapper.getInstances() vector and destroy all instances
          for (auto& materialInstanceWrapper : pMaterialImpl->getInstances()) {
            std::unique_lock lock(sharedThis->_mutex);
            MaterialInstance* materialInstance = materialInstanceWrapper->getMaterialInstance();
            engine->destroy(materialInstance);
          }

          delete pMaterialImpl;
        });
      });

  return std::make_shared<MaterialWrapper>(materialImpl);
}

std::shared_ptr<LightManagerWrapper> EngineImpl::createLightManager() {
  std::unique_lock lock(_mutex);
  return std::make_shared<LightManagerWrapper>(_engine);
}

} // namespace margelo
