//
// Created by Marc Rousavy on 21.02.24.
//

#include "EngineWrapper.h"

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

EngineWrapper::EngineWrapper(std::shared_ptr<Choreographer> choreographer, std::shared_ptr<Dispatcher> rendererDispatcher,
                             std::shared_ptr<Engine> engine)
    : PointerHolder<Engine>("EngineWrapper", engine) {
  _rendererDispatcher = rendererDispatcher;

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

  _choreographer = choreographer;
  _transformManager = createTransformManager();
}

void EngineWrapper::loadHybridMethods() {
  registerHybridMethod("setSurfaceProvider", &EngineWrapper::setSurfaceProvider, this);
  registerHybridMethod("setRenderCallback", &EngineWrapper::setRenderCallback, this);
  registerHybridMethod("setIndirectLight", &EngineWrapper::setIndirectLight, this);

  registerHybridMethod("loadAsset", &EngineWrapper::loadAsset, this);
  registerHybridMethod("loadInstancedAsset", &EngineWrapper::loadInstancedAsset, this);

  // Filament API:
  registerHybridMethod("getScene", &EngineWrapper::getScene, this);
  registerHybridMethod("getView", &EngineWrapper::getView, this);
  registerHybridMethod("getCamera", &EngineWrapper::getCamera, this);
  registerHybridMethod("getCameraManipulator", &EngineWrapper::getCameraManipulator, this);
  registerHybridMethod("transformToUnitCube", &EngineWrapper::transformToUnitCube, this);
  registerHybridMethod("setEntityPosition", &EngineWrapper::setEntityPosition, this);
  registerHybridMethod("setEntityRotation", &EngineWrapper::setEntityRotation, this);
  registerHybridMethod("setEntityScale", &EngineWrapper::setEntityScale, this);
  registerHybridMethod("setIsPaused", &EngineWrapper::setIsPaused, this);
  registerHybridMethod("getTransformManager", &EngineWrapper::getTransformManager, this);
  registerHybridMethod("createRenderableManager", &EngineWrapper::createRenderableManager, this);
  registerHybridMethod("createMaterial", &EngineWrapper::createMaterial, this);
  registerHybridMethod("createLightManager", &EngineWrapper::createLightManager, this);

  // Combined Physics API:
  registerHybridMethod("updateTransformByRigidBody", &EngineWrapper::updateTransformByRigidBody, this);
}

void EngineWrapper::setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider) {
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
  std::weak_ptr<EngineWrapper> weakSelf = shared<EngineWrapper>();
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
                                               Logger::log(TAG, "Updating Surface size...");
                                               sharedThis->surfaceSizeChanged(width, height);
                                               sharedThis->synchronizePendingFrames();
                                             }
                                           });
                                         },
                                     .onSurfaceDestroyed =
                                         [dispatcher, weakSelf](std::shared_ptr<Surface> surface) {
                                           dispatcher->runAsync([=]() {
                                             auto sharedThis = weakSelf.lock();
                                             if (sharedThis != nullptr) {
                                               sharedThis->destroySurface();
                                             }
                                           });
                                         }};
  _surfaceListener = surfaceProvider->addOnSurfaceChangedListener(std::move(callback));
}

void EngineWrapper::setSurface(std::shared_ptr<Surface> surface) {
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
  std::weak_ptr<EngineWrapper> weakSelf = shared<EngineWrapper>();
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

void EngineWrapper::setIsPaused(bool isPaused) {
  _isPaused = isPaused;
  if (isPaused) {
    Logger::log(TAG, "Pausing renderer...");
    _choreographer->stop();
  } else {
    Logger::log(TAG, "Resuming renderer...");
    _choreographer->start();
  }
}

void EngineWrapper::surfaceSizeChanged(int width, int height) {
  std::unique_lock lock(_mutex);
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

void EngineWrapper::destroySurface() {
  if (_swapChain == nullptr) {
    // Surface is already destroyed / never existed.
    return;
  }

  Logger::log(TAG, "Destroying surface...");
  _choreographer->stop();
  _choreographerListener->remove();
  _swapChain = nullptr;
}

void EngineWrapper::setRenderCallback(std::optional<RenderCallback> callback) {
  if (callback.has_value()) {
    Logger::log(TAG, "Setting render callback");
  } else {
    Logger::log(TAG, "Removing render callback");
  }

  _renderCallback = callback;
}

// This method is connected to the choreographer and gets called every frame,
// once we have a surface.
void EngineWrapper::renderFrame(double timestamp) {
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

  std::shared_ptr<SwapChain> swapChain = _swapChain->getSwapChain();
  if (_renderer->beginFrame(swapChain.get(), timestamp)) {
    [[likely]];
    _renderer->render(_view.get());
    _renderer->endFrame();
  }
}

std::shared_ptr<Renderer> EngineWrapper::createRenderer() {
  auto dispatcher = _rendererDispatcher;
  std::shared_ptr<Renderer> renderer = References<Renderer>::adoptEngineRef(
      pointee(), pointee()->createRenderer(), [dispatcher](std::shared_ptr<Engine> engine, Renderer* renderer) {
        dispatcher->runAsync([engine, renderer]() {
          Logger::log(TAG, "Destroying renderer...");
          engine->destroy(renderer);
        });
      });
  renderer->setClearOptions({.clear = true});
  return renderer;
}

std::shared_ptr<Scene> EngineWrapper::createScene() {
  auto materialProvider = _materialProvider;
  auto dispatcher = _rendererDispatcher;
  std::shared_ptr<Scene> scene = References<Scene>::adoptEngineRef(
      pointee(), pointee()->createScene(), [materialProvider, dispatcher](std::shared_ptr<Engine> engine, Scene* scene) {
        dispatcher->runAsync([materialProvider, engine, scene]() {
          Logger::log(TAG, "Destroying scene...");
          // Destroy all materials that were created by the material provider
          materialProvider->destroyMaterials();
          engine->destroy(scene);
        });
      });

  return scene;
}

std::shared_ptr<View> EngineWrapper::createView() {
  auto dispatcher = _rendererDispatcher;
  std::shared_ptr view =
      References<View>::adoptEngineRef(pointee(), pointee()->createView(), [dispatcher](std::shared_ptr<Engine> engine, View* view) {
        dispatcher->runAsync([engine, view]() {
          Logger::log(TAG, "Destroying view...");
          engine->destroy(view);
        });
      });

  return view;
}

std::shared_ptr<SwapChainWrapper> EngineWrapper::createSwapChain(std::shared_ptr<Surface> surface) {
  auto dispatcher = _rendererDispatcher;
  void* nativeWindow = surface->getSurface();
  auto swapChain = References<SwapChain>::adoptEngineRef(pointee(), pointee()->createSwapChain(nativeWindow, SwapChain::CONFIG_TRANSPARENT),
                                                         [dispatcher](std::shared_ptr<Engine> engine, SwapChain* swapChain) {
                                                           dispatcher->runAsync([engine, swapChain]() {
                                                             Logger::log(TAG, "Destroying swapchain...");
                                                             engine->destroy(swapChain);
                                                             engine->flushAndWait();
                                                           });
                                                         });

  return std::make_shared<SwapChainWrapper>(swapChain);
}

std::shared_ptr<Camera> EngineWrapper::createCamera() {
  auto dispatcher = _rendererDispatcher;
  std::shared_ptr<Camera> camera =
      References<Camera>::adoptEngineRef(pointee(), pointee()->createCamera(pointee()->getEntityManager().create()),
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

std::shared_ptr<FilamentAssetWrapper> EngineWrapper::loadAsset(std::shared_ptr<FilamentBuffer> modelBuffer) {
  std::unique_lock lock(_mutex);
  std::shared_ptr<ManagedBuffer> buffer = modelBuffer->getBuffer();
  gltfio::FilamentAsset* assetPtr = _assetLoader->createAsset(buffer->getData(), buffer->getSize());

  return makeAssetWrapper(assetPtr);
}

std::shared_ptr<FilamentAssetWrapper> EngineWrapper::loadInstancedAsset(std::shared_ptr<FilamentBuffer> modelBuffer, int instanceCount) {
  std::unique_lock lock(_mutex);
  std::shared_ptr<ManagedBuffer> buffer = modelBuffer->getBuffer();
  FilamentInstance* instances[instanceCount]; // Memory managed by the FilamentAsset
  gltfio::FilamentAsset* assetPtr = _assetLoader->createInstancedAsset(buffer->getData(), buffer->getSize(), instances, instanceCount);

  return makeAssetWrapper(assetPtr);
}

std::shared_ptr<FilamentAssetWrapper> EngineWrapper::makeAssetWrapper(FilamentAsset* assetPtr) {
  if (assetPtr == nullptr) {
    throw std::runtime_error("Failed to load asset");
  }

  auto assetLoader = _assetLoader;
  auto dispatcher = _rendererDispatcher;
  auto scene = _scene;
  auto asset = References<gltfio::FilamentAsset>::adoptRef(assetPtr, [dispatcher, assetLoader, scene](gltfio::FilamentAsset* asset) {
    dispatcher->runAsync([assetLoader, asset, scene]() {
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
void EngineWrapper::setIndirectLight(std::shared_ptr<FilamentBuffer> iblBuffer, std::optional<double> intensity,
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
      pointee().get(), *iblBundle, false,
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

  IndirectLight* _indirectLight = builder.build(*pointee());
  _scene->setIndirectLight(_indirectLight);
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

std::shared_ptr<TransformManagerWrapper> EngineWrapper::createTransformManager() {
  return std::make_shared<TransformManagerWrapper>(pointee()->getTransformManager());
}

/**
 * Sets up a root transform on the current model to make it fit into a unit cube.
 */
void EngineWrapper::transformToUnitCube(std::shared_ptr<FilamentAssetWrapper> asset) {
  TransformManager& tm = pointee()->getTransformManager();
  asset->transformToUnitCube(tm);
}

void EngineWrapper::synchronizePendingFrames() {
  // Wait for all pending frames to be processed before returning. This is to
  // avoid a race between the surface being resized before pending frames are
  // rendered into it.
  Fence* fence = pointee()->createFence();
  fence->wait(Fence::Mode::FLUSH, Fence::FENCE_WAIT_FOR_EVER);
  pointee()->destroy(fence);
}

/**
 * Internal method that will help updating the transform of an entity.
 * @param transform The transform matrix to apply
 * @param entity The entity to apply the transform to
 * @param multiplyCurrent If true, the current transform will be multiplied with the new transform, otherwise it will be replaced
 */
void EngineWrapper::updateTransform(math::mat4 transform, std::shared_ptr<EntityWrapper> entity, bool multiplyCurrent) {
  std::unique_lock lock(_mutex);
  if (!entity) {
    throw std::invalid_argument("Entity is null");
  }

  TransformManager& tm = pointee()->getTransformManager();
  EntityInstance<TransformManager> entityInstance = tm.getInstance(entity->getEntity());
  auto currentTransform = tm.getTransform(entityInstance);
  auto newTransform = multiplyCurrent ? (transform * currentTransform) : transform;
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
  if (axis.x == 0 && axis.y == 0 && axis.z == 0) {
    throw std::invalid_argument("Axis cannot be zero");
  }

  auto rotationMatrix = math::mat4::rotation(angleRadians, axis);
  updateTransform(rotationMatrix, entity, multiplyCurrent);
}

void EngineWrapper::setEntityScale(std::shared_ptr<EntityWrapper> entity, std::vector<double> scaleVec, bool multiplyCurrent) {
  math::float3 scale = Converter::VecToFloat3(scaleVec);
  auto scaleMatrix = math::mat4::scaling(scale);
  updateTransform(scaleMatrix, entity, multiplyCurrent);
}

void EngineWrapper::updateTransformByRigidBody(std::shared_ptr<EntityWrapper> entityWrapper, std::shared_ptr<RigidBodyWrapper> rigidBody) {
  std::unique_lock lock(_mutex);
  if (!rigidBody) {
    throw std::invalid_argument("RigidBody is null");
  }
  if (!entityWrapper) {
    throw std::invalid_argument("EntityWrapper is null");
  }

  // get rotation & position from the rigid body (it's not containing any scale information)
  std::shared_ptr<btRigidBody> collisionObject = rigidBody->getRigidBody();
  btMotionState* motionState = collisionObject->getMotionState();
  btTransform bodyTransform;
  motionState->getWorldTransform(bodyTransform);
  btQuaternion rotation = bodyTransform.getRotation();
  btVector3 position = bodyTransform.getOrigin();

  // Create a filament rotation from the bullet rotation
  math::quatf filamentQuat = math::quatf(rotation.getW(), rotation.getX(), rotation.getY(), rotation.getZ());
  math::mat4f filamentRotation = math::mat4f(filamentQuat);

  // Create a filament position from the bullet position
  math::float3 filamentPosition = math::float3(position.getX(), position.getY(), position.getZ());
  math::mat4f filamentTranslation = math::mat4f::translation(filamentPosition);

  // Get the current transform of the filament entity
  TransformManager& tm = pointee()->getTransformManager();
  Entity entity = entityWrapper->getEntity();
  EntityInstance<TransformManager> entityInstance = tm.getInstance(entity);
  math::mat4f currentTransform = tm.getTransform(entityInstance);

  // Get the current scale of the filament entity
  float scaleX = std::sqrt(currentTransform[0][0] * currentTransform[0][0] + currentTransform[0][1] * currentTransform[0][1] +
                           currentTransform[0][2] * currentTransform[0][2]);
  float scaleY = std::sqrt(currentTransform[1][0] * currentTransform[1][0] + currentTransform[1][1] * currentTransform[1][1] +
                           currentTransform[1][2] * currentTransform[1][2]);
  float scaleZ = std::sqrt(currentTransform[2][0] * currentTransform[2][0] + currentTransform[2][1] * currentTransform[2][1] +
                           currentTransform[2][2] * currentTransform[2][2]);
  //  Logger::log("EngineWrapper", "scaleX: %f, scaleY: %f, scaleZ: %f", scaleX, scaleY, scaleZ);
  math::vec3<float> scaleVec = {scaleX, scaleY, scaleZ};
  auto filamentScale = math::mat4f::scaling(scaleVec);

  // Create a new transform from the position, rotation and scale
  auto newTransform = filamentTranslation * filamentRotation * filamentScale;

  // Set the new transform
  tm.setTransform(entityInstance, newTransform);
}

std::shared_ptr<RenderableManagerWrapper> EngineWrapper::createRenderableManager() {
  std::unique_lock lock(_mutex);
  return std::make_shared<RenderableManagerWrapper>(pointee());
}

std::shared_ptr<MaterialWrapper> EngineWrapper::createMaterial(std::shared_ptr<FilamentBuffer> materialBuffer) {
  std::unique_lock lock(_mutex);
  auto buffer = materialBuffer->getBuffer();
  if (buffer->getSize() == 0) {
    throw std::runtime_error("Material buffer is empty");
  }

  auto dispatcher = _rendererDispatcher;
  Material::Builder builder = Material::Builder().package(buffer->getData(), buffer->getSize());
  std::shared_ptr<Material> material = References<Material>::adoptEngineRef(
      pointee(), builder.build(*pointee()), [dispatcher](std::shared_ptr<Engine> engine, Material* material) {
        dispatcher->runAsync([engine, material]() {
          Logger::log(TAG, "Destroying material...");
          engine->destroy(material);
        });
      });

  return References<MaterialWrapper>::adoptEngineRef(pointee(), new MaterialWrapper(material),
                                                     [dispatcher](std::shared_ptr<Engine> engine, MaterialWrapper* materialWrapper) {
                                                       dispatcher->runAsync([engine, materialWrapper]() {
                                                         // Iterate over materialWrapper.getInstances() vector and destroy all instances
                                                         for (auto& materialInstanceWrapper : materialWrapper->getInstances()) {
                                                           auto materialInstance = materialInstanceWrapper->getMaterialInstance();
                                                           engine->destroy(materialInstance);
                                                         }

                                                         delete materialWrapper;
                                                       });
                                                     });
}
std::shared_ptr<LightManagerWrapper> EngineWrapper::createLightManager() {
  std::unique_lock lock(_mutex);
  return std::make_shared<LightManagerWrapper>(pointee());
}

} // namespace margelo
