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

#include <unistd.h>
#include <utility>

namespace margelo {

EngineWrapper::EngineWrapper(const std::shared_ptr<Choreographer>& choreographer, const std::shared_ptr<Dispatcher>& dispatcher)
    : HybridObject("EngineWrapper") {
  // TODO: make the enum for the backend for the engine configurable
  _dispatcher = dispatcher;
  _engine = References<Engine>::adoptRef(Engine::create(), [dispatcher](Engine* engine) {
    // Make sure that the engine gets destroyed on the thread that it was created on (JS thread).
    // It can happen that the engine gets cleaned up by Hades (hermes GC) on a different thread.
    dispatcher->runAsync([engine]() {
      Logger::log(TAG, "Destroying engine...");
      Engine::destroy(engine);
    });
  });
  //  _engine->getJobSystem().adopt();

  gltfio::MaterialProvider* _materialProviderPtr =
      gltfio::createUbershaderProvider(_engine.get(), UBERARCHIVE_DEFAULT_DATA, UBERARCHIVE_DEFAULT_SIZE);
  _materialProvider = References<gltfio::MaterialProvider>::adoptEngineRef(
      _engine, _materialProviderPtr, [](const std::shared_ptr<Engine>& engine, gltfio::MaterialProvider* provider) {
        Logger::log(TAG, "Destroying material provider...");
        // Note: The materials of the provider are getting destroyed when the scene is destroyed,
        // as the scene controls when the assets are getting destroyed (and only then we can destroy the materials).
        delete provider;
      });

  EntityManager& entityManager = _engine->getEntityManager();
  NameComponentManager* ncm = new NameComponentManager(entityManager);
  gltfio::AssetConfiguration assetConfig{.engine = _engine.get(), .materials = _materialProvider.get(), .names = ncm};
  gltfio::AssetLoader* assetLoaderPtr = gltfio::AssetLoader::create(assetConfig);
  _assetLoader = References<gltfio::AssetLoader>::adoptEngineRef(
      _engine, assetLoaderPtr, [ncm](const std::shared_ptr<Engine>& engine, gltfio::AssetLoader* assetLoader) {
        Logger::log(TAG, "Destroying asset loader...");
        delete ncm;
        gltfio::AssetLoader::destroy(&assetLoader);
      });

  filament::gltfio::ResourceConfiguration resourceConfig{.engine = _engine.get(), .normalizeSkinningWeights = true};
  auto* resourceLoaderPtr = new filament::gltfio::ResourceLoader(resourceConfig);
  // Add texture providers to the resource loader
  auto* stbProvider = filament::gltfio::createStbProvider(_engine.get());
  auto* ktx2Provider = filament::gltfio::createKtx2Provider(_engine.get());
  resourceLoaderPtr->addTextureProvider("image/jpeg", stbProvider);
  resourceLoaderPtr->addTextureProvider("image/png", stbProvider);
  resourceLoaderPtr->addTextureProvider("image/ktx2", ktx2Provider);

  _resourceLoader = References<gltfio::ResourceLoader>::adoptEngineRef(
      _engine, resourceLoaderPtr,
      [stbProvider, ktx2Provider](const std::shared_ptr<Engine>& engine, gltfio::ResourceLoader* resourceLoader) {
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

  _view->getView()->setScene(_scene->getScene().get());
  _view->getView()->setCamera(_camera->getCamera().get());

  _choreographer = choreographer;
  _transformManager = createTransformManager();
        
  auto threadId = std::this_thread::get_id();
  Logger::log(TAG, "Engine created on thread %d", threadId);
        
}

void EngineWrapper::loadHybridMethods() {
  registerHybridMethod("setSurfaceProvider", &EngineWrapper::setSurfaceProvider, this);
  registerHybridMethod("setRenderCallback", &EngineWrapper::setRenderCallback, this);
  registerHybridMethod("setIndirectLight", &EngineWrapper::setIndirectLight, this);

  registerHybridMethod("loadAsset", &EngineWrapper::loadAsset, this);
  registerHybridMethod("loadInstancedAsset", &EngineWrapper::loadInstancedAsset, this);

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
  registerHybridMethod("setIsPaused", &EngineWrapper::setIsPaused, this);
  registerHybridMethod("getTransformManager", &EngineWrapper::getTransformManager, this);
  registerHybridMethod("getRenderableManager", &EngineWrapper::getRendererableManager, this);
  registerHybridMethod("createMaterial", &EngineWrapper::createMaterial, this);

  // Combined Physics API:
  registerHybridMethod("updateTransformByRigidBody", &EngineWrapper::updateTransformByRigidBody, this);
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

  auto dispatcher = _dispatcher;
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
                                           // Note: When the surface gets destroyed we immediately need to destroy the swapchain
                                           // and flush to avoid flickering issues.
                                           auto sharedThis = weakSelf.lock();
                                           if (sharedThis != nullptr) {
                                             sharedThis->destroySurface();
                                           }
                                         }};
  _surfaceListener = surfaceProvider->addOnSurfaceChangedListener(callback);
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
  if (_cameraManipulator) {
    _cameraManipulator->getManipulator()->setViewport(width, height);
  }
  if (_view) {
    _view->setViewport(0, 0, width, height);
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

  if (_renderCallback.has_value()) {
    const auto& renderCallback = _renderCallback.value();
    // Call JS callback with scene information
    double passedSeconds = (timestamp - _startTime) / 1e9;
    renderCallback(timestamp, _startTime, passedSeconds);
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
  auto materialProvider = _materialProvider;
  std::shared_ptr<Scene> scene = References<Scene>::adoptEngineRef(_engine, _engine->createScene(),
                                                                   [materialProvider](const std::shared_ptr<Engine>& engine, Scene* scene) {
                                                                     Logger::log(TAG, "Destroying scene...");
                                                                     // The scene will destroy all assets that were used in that scene, so
                                                                     // now we can destroy all materials:
                                                                     materialProvider->destroyMaterials();
                                                                     engine->destroy(scene);
                                                                   });

  return std::make_shared<SceneWrapper>(scene, _assetLoader);
}

std::shared_ptr<ViewWrapper> EngineWrapper::createView() {
  std::shared_ptr view = References<View>::adoptEngineRef(_engine, _engine->createView(),
                                                          [](const std::shared_ptr<Engine>& engine, View* view) { engine->destroy(view); });

  return std::make_shared<ViewWrapper>(view);
}

std::shared_ptr<SwapChainWrapper> EngineWrapper::createSwapChain(std::shared_ptr<Surface> surface) {
  auto dispatcher = _dispatcher;
  auto swapChain =
      References<SwapChain>::adoptEngineRef(_engine, _engine->createSwapChain(surface->getSurface(), SwapChain::CONFIG_TRANSPARENT),
                                            [dispatcher](const std::shared_ptr<Engine>& engine, SwapChain* swapChain) {
                                              dispatcher->runSync([engine, swapChain]() {
                                                engine->destroy(swapChain);
                                                engine->flushAndWait();
                                              });
                                            });

  return std::make_shared<SwapChainWrapper>(swapChain);
}

std::shared_ptr<CameraWrapper> EngineWrapper::createCamera() {
  std::shared_ptr<Camera> camera = References<Camera>::adoptEngineRef(_engine, _engine->createCamera(_engine->getEntityManager().create()),
                                                                      [](const std::shared_ptr<Engine>& engine, Camera* camera) {
                                                                        EntityManager::get().destroy(camera->getEntity());
                                                                        engine->destroyCameraComponent(camera->getEntity());
                                                                      });

  const float aperture = 16.0f;
  const float shutterSpeed = 1.0f / 125.0f;
  const float sensitivity = 100.0f;
  camera->setExposure(aperture, shutterSpeed, sensitivity);
  return std::make_shared<CameraWrapper>(camera);
}

std::shared_ptr<FilamentAssetWrapper> EngineWrapper::loadAsset(std::shared_ptr<FilamentBuffer> modelBuffer) {
    auto threadId = std::this_thread::get_id();
    Logger::log(TAG, "Trying to create asset on thread %d", threadId);
    
  std::shared_ptr<ManagedBuffer> buffer = modelBuffer->getBuffer();
  gltfio::FilamentAsset* assetPtr = _assetLoader->createAsset(buffer->getData(), buffer->getSize());

  return makeAssetWrapper(assetPtr);
}

std::shared_ptr<FilamentAssetWrapper> EngineWrapper::loadInstancedAsset(std::shared_ptr<FilamentBuffer> modelBuffer, int instanceCount) {
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
  auto asset = References<gltfio::FilamentAsset>::adoptRef(
      assetPtr, [assetLoader](gltfio::FilamentAsset* asset) { assetLoader->destroyAsset(asset); });

  auto scene = _scene;
  if (!scene) {
    throw std::runtime_error("Scene not initialized");
  }

  // TODO: When supporting loading glTF files with external resources, we need to load the resources here
  //    const char* const* const resourceUris = asset->getResourceUris();
  //    const size_t resourceUriCount = asset->getResourceUriCount();
  _resourceLoader->loadResources(asset.get());

  return std::make_shared<FilamentAssetWrapper>(asset);
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

std::shared_ptr<TransformManagerWrapper> EngineWrapper::createTransformManager() {
  return std::make_shared<TransformManagerWrapper>(_engine->getTransformManager());
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
  TransformManager& tm = _engine->getTransformManager();
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

std::shared_ptr<RenderableManagerWrapper> EngineWrapper::getRendererableManager() {
  RenderableManager& rm = _engine->getRenderableManager();

  // Create a new texture provider
  auto stbTextureProvider = std::shared_ptr<TextureProvider>(filament::gltfio::createStbProvider(_engine.get()));

  return std::make_shared<RenderableManagerWrapper>(rm, stbTextureProvider, _engine);
}

std::shared_ptr<MaterialWrapper> EngineWrapper::createMaterial(std::shared_ptr<FilamentBuffer> materialBuffer) {
  auto buffer = materialBuffer->getBuffer();
  if (buffer->getSize() == 0) {
    throw std::runtime_error("Material buffer is empty");
  }

  Material::Builder builder = Material::Builder().package(buffer->getData(), buffer->getSize());
  std::shared_ptr<Material> material = References<Material>::adoptEngineRef(
      _engine, builder.build(*_engine), [](const std::shared_ptr<Engine>& engine, Material* material) { engine->destroy(material); });

  return References<MaterialWrapper>::adoptEngineRef(_engine, new MaterialWrapper(material),
                                                     [](const std::shared_ptr<Engine>& engine, MaterialWrapper* materialWrapper) {
                                                       // Iterate over materialWrapper.getInstances() vector and destroy all instances
                                                       for (auto& materialInstanceWrapper : materialWrapper->getInstances()) {
                                                         auto materialInstance = materialInstanceWrapper->getMaterialInstance();
                                                         engine->destroy(materialInstance);
                                                       }

                                                       delete materialWrapper;
                                                     });
}

} // namespace margelo
