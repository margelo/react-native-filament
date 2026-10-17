#include "HybridEngine.hpp"

#include "HybridFrameListenerSubscription.hpp"
#include "HybridRenderThread.hpp"
#include "assets/HybridModel.hpp"
#include "control/HybridCameraManipulator.hpp"
#include "control/HybridTransformBinding.hpp"
#include "control/HybridValueBinding.hpp"
#include "materials/HybridMaterial.hpp"
#include "materials/HybridTexture.hpp"
#include "materials/MaterialFile.hpp"
#include "scene/HybridCamera.hpp"
#include "scene/HybridIndirectLight.hpp"
#include "scene/HybridLight.hpp"
#include "scene/HybridLightManager.hpp"
#include "scene/HybridRenderableManager.hpp"
#include "scene/HybridScene.hpp"
#include "scene/HybridSkybox.hpp"
#include "scene/HybridTransformManager.hpp"
#include "scene/Ktx1Cubemap.hpp"
#include "utils/ComponentChecks.hpp"
#include "utils/ThreadChecks.hpp"
#include "utils/Trs.hpp"

#include "targets/HybridViewTarget.hpp"
#include "targets/ViewTargetCore.hpp"

#include <filament/Material.h>
#include <gltfio/FilamentInstance.h>
#include <ktxreader/Ktx1Reader.h>

#include <cmath>
#include <stdexcept>
#include <vector>

namespace margelo::nitro::filament {

HybridEngine::HybridEngine(std::shared_ptr<EngineCore> core)
    : HybridObject(TAG), core_(std::move(core)), renderThread_(std::make_shared<HybridRenderThread>(core_)),
      transformManager_(std::make_shared<HybridTransformManager>(core_)), lightManager_(std::make_shared<HybridLightManager>(core_)),
      renderableManager_(std::make_shared<HybridRenderableManager>(core_)) {}

HybridEngine::~HybridEngine() {
  core_->shutdown();
}

EngineBackend HybridEngine::getBackend() {
  return core_->backend();
}

std::shared_ptr<HybridRenderThreadSpec> HybridEngine::getRenderThread() {
  return renderThread_;
}

std::shared_ptr<HybridTransformManagerSpec> HybridEngine::getTransformManager() {
  return transformManager_;
}

std::shared_ptr<HybridLightManagerSpec> HybridEngine::getLightManager() {
  return lightManager_;
}

std::shared_ptr<HybridRenderableManagerSpec> HybridEngine::getRenderableManager() {
  return renderableManager_;
}

RenderMode HybridEngine::getRenderMode() {
  return core_->renderMode();
}

void HybridEngine::setRenderMode(RenderMode renderMode) {
  core_->setRenderMode(renderMode);
}

std::shared_ptr<Promise<std::shared_ptr<HybridViewTargetSpec>>>
HybridEngine::createViewTarget(const std::shared_ptr<HybridFilamentViewSpec>& view, const ViewTargetOptions& options) {
  auto promise = Promise<std::shared_ptr<HybridViewTargetSpec>>::create();
  ViewTargetCore::ClearSettings clear = HybridViewTarget::toClearSettings(options.clearOptions);
  auto engine = shared_cast<HybridEngine>();
  core_->thread().post({
      .run =
          [engine, view, clear, promise] {
            auto target = std::make_shared<ViewTargetCore>(engine->core()->engine(), clear);
            engine->core()->adopt(target);
            engine->core()->addTarget(target);
            promise->resolve(std::make_shared<HybridViewTarget>(engine, target, view));
          },
      .cancel = [promise] { promise->reject(std::make_exception_ptr(std::runtime_error("The Engine was shut down."))); },
  });
  return promise;
}

std::shared_ptr<HybridSceneSpec> HybridEngine::createScene() {
  requireRenderThread(core_->thread(), "Engine.createScene()");
  auto scene = std::make_shared<SceneCore>(core_);
  core_->adopt(scene);
  core_->scenes().add(scene);
  return std::make_shared<HybridScene>(shared_cast<HybridEngine>(), scene);
}

std::shared_ptr<HybridCameraSpec> HybridEngine::createCamera() {
  requireRenderThread(core_->thread(), "Engine.createCamera()");
  auto camera = std::make_shared<CameraCore>(core_);
  core_->adopt(camera);
  return std::make_shared<HybridCamera>(shared_cast<HybridEngine>(), camera);
}

std::shared_ptr<HybridSkyboxSpec> HybridEngine::createSkybox(const std::tuple<double, double, double, double>& color) {
  requireRenderThread(core_->thread(), "Engine.createSkybox()");
  auto [r, g, b, a] = color;
  std::array<float, 4> linear{static_cast<float>(r), static_cast<float>(g), static_cast<float>(b), static_cast<float>(a)};
  auto skybox = std::make_shared<SkyboxCore>(core_, linear);
  core_->adopt(skybox);
  return std::make_shared<HybridSkybox>(shared_cast<HybridEngine>(), skybox);
}

std::shared_ptr<HybridLightSpec> HybridEngine::createDirectionalLight(const DirectionalLightOptions& options) {
  requireRenderThread(core_->thread(), "Engine.createDirectionalLight()");
  return adoptLight(LightCore::createDirectional(core_, options));
}

std::shared_ptr<HybridLightSpec> HybridEngine::createSunLight(const SunLightOptions& options) {
  requireRenderThread(core_->thread(), "Engine.createSunLight()");
  return adoptLight(LightCore::createSun(core_, options));
}

std::shared_ptr<HybridLightSpec> HybridEngine::createPointLight(const PointLightOptions& options) {
  requireRenderThread(core_->thread(), "Engine.createPointLight()");
  return adoptLight(LightCore::createPoint(core_, options));
}

std::shared_ptr<HybridLightSpec> HybridEngine::createSpotLight(const SpotLightOptions& options) {
  requireRenderThread(core_->thread(), "Engine.createSpotLight()");
  return adoptLight(LightCore::createSpot(core_, options, false));
}

std::shared_ptr<HybridLightSpec> HybridEngine::createFocusedSpotLight(const SpotLightOptions& options) {
  requireRenderThread(core_->thread(), "Engine.createFocusedSpotLight()");
  return adoptLight(LightCore::createSpot(core_, options, true));
}

std::shared_ptr<HybridLightSpec> HybridEngine::adoptLight(std::shared_ptr<LightCore> light) {
  core_->adopt(light);
  return std::make_shared<HybridLight>(shared_cast<HybridEngine>(), std::move(light));
}

std::shared_ptr<Promise<std::shared_ptr<HybridModelSpec>>> HybridEngine::loadModel(const AssetSource& source,
                                                                                   const ModelLoadOptions& options) {
  double requested = options.instanceCount.value_or(1);
  if (requested < 1 || requested != std::floor(requested)) {
    throw std::invalid_argument("Engine.loadModel() needs an integer instanceCount >= 1.");
  }
  auto instanceCount = static_cast<size_t>(requested);
  auto promise = Promise<std::shared_ptr<HybridModelSpec>>::create();
  auto engine = shared_cast<HybridEngine>();
  withAssetBytes(source, promise, [engine, promise, instanceCount](const std::shared_ptr<ArrayBuffer>& bytes) {
    std::vector<::filament::gltfio::FilamentInstance*> instances(instanceCount);
    ::filament::gltfio::FilamentAsset* asset =
        bytes->size() > UINT32_MAX ? nullptr
                                   : engine->core()->gltf().assetLoader().createInstancedAsset(
                                         bytes->data(), static_cast<uint32_t>(bytes->size()), instances.data(), instanceCount);
    if (asset == nullptr) {
      promise->reject(
          std::make_exception_ptr(std::invalid_argument("FilamentAssetError: The source is not a valid glTF 2.0 binary (.glb).")));
      return;
    }
    engine->core()->startModelLoad(asset, [engine, promise](::filament::gltfio::FilamentAsset* loaded, std::exception_ptr error) {
      if (error != nullptr) {
        promise->reject(error);
        return;
      }
      auto model = std::make_shared<ModelCore>(engine->core(), loaded);
      engine->core()->adopt(model);
      promise->resolve(std::make_shared<HybridModel>(engine, model));
    });
  });
  return promise;
}

std::shared_ptr<Promise<std::shared_ptr<HybridIndirectLightSpec>>> HybridEngine::loadIndirectLight(const AssetSource& source,
                                                                                                   const IndirectLightOptions& options) {
  auto intensity = static_cast<float>(options.intensity.value_or(30000));
  auto promise = Promise<std::shared_ptr<HybridIndirectLightSpec>>::create();
  auto engine = shared_cast<HybridEngine>();
  withAssetBytes(source, promise, [engine, promise, intensity](const std::shared_ptr<ArrayBuffer>& bytes) {
    try {
      auto light = std::make_shared<IndirectLightCore>(engine->core(), bytes->data(), bytes->size(), intensity);
      engine->core()->adopt(light);
      promise->resolve(std::make_shared<HybridIndirectLight>(engine, light));
    } catch (...) {
      promise->reject(std::current_exception());
    }
  });
  return promise;
}

std::shared_ptr<Promise<std::shared_ptr<HybridMaterialSpec>>> HybridEngine::loadMaterial(const AssetSource& source) {
  auto promise = Promise<std::shared_ptr<HybridMaterialSpec>>::create();
  auto engine = shared_cast<HybridEngine>();
  withAssetBytes(source, promise, [engine, promise](const std::shared_ptr<ArrayBuffer>& bytes) {
    try {
      requireMaterialFile(bytes->data(), bytes->size());
      ::filament::Material* material =
          ::filament::Material::Builder().package(bytes->data(), bytes->size()).build(engine->core()->engine());
      if (material == nullptr) {
        throw std::invalid_argument("FilamentAssetError: Filament could not build the material.");
      }
      auto core = std::make_shared<MaterialCore>(engine->core(), material);
      engine->core()->adopt(core);
      promise->resolve(std::make_shared<HybridMaterial>(engine->core(), core));
    } catch (...) {
      promise->reject(std::current_exception());
    }
  });
  return promise;
}

std::shared_ptr<Promise<std::shared_ptr<HybridTextureSpec>>> HybridEngine::loadTexture(const AssetSource& source,
                                                                                       const TextureLoadOptions& options) {
  bool srgb = options.srgb.value_or(true);
  auto promise = Promise<std::shared_ptr<HybridTextureSpec>>::create();
  auto engine = shared_cast<HybridEngine>();
  withAssetBytes(source, promise, [engine, promise, srgb](const std::shared_ptr<ArrayBuffer>& bytes) {
    engine->core()->decodeTexture(bytes->data(), bytes->size(), srgb,
                                  [engine, promise](::filament::Texture* texture, std::exception_ptr error) {
                                    if (error != nullptr) {
                                      promise->reject(error);
                                      return;
                                    }
                                    auto core = std::make_shared<TextureCore>(engine->core(), texture);
                                    engine->core()->adopt(core);
                                    promise->resolve(std::make_shared<HybridTexture>(engine->core(), core));
                                  });
  });
  return promise;
}

std::shared_ptr<Promise<std::shared_ptr<HybridSkyboxSpec>>> HybridEngine::loadSkybox(const AssetSource& source) {
  auto promise = Promise<std::shared_ptr<HybridSkyboxSpec>>::create();
  auto engine = shared_cast<HybridEngine>();
  withAssetBytes(source, promise, [engine, promise](const std::shared_ptr<ArrayBuffer>& bytes) {
    try {
      std::unique_ptr<image::Ktx1Bundle> bundle = parseKtx1Cubemap(bytes->data(), bytes->size(), "skybox");
      ::filament::Texture* environment = ktxreader::Ktx1Reader::createTexture(&engine->core()->engine(), bundle.release(), false);
      auto core = std::make_shared<SkyboxCore>(engine->core(), environment);
      engine->core()->adopt(core);
      promise->resolve(std::make_shared<HybridSkybox>(engine, core));
    } catch (...) {
      promise->reject(std::current_exception());
    }
  });
  return promise;
}

template <typename T>
void HybridEngine::withAssetBytes(const AssetSource& source, const std::shared_ptr<Promise<T>>& promise,
                                  std::function<void(const std::shared_ptr<ArrayBuffer>& bytes)> onRenderThread) {
  std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> bytes = readAssetBytes(source);
  bytes->addOnResolvedListener([core = core_, promise, onRenderThread](const std::shared_ptr<ArrayBuffer>& data) {
    core->thread().post({
        .run = [onRenderThread, data] { onRenderThread(data); },
        .cancel = [promise] { promise->reject(std::make_exception_ptr(std::runtime_error("The Engine was shut down."))); },
    });
  });
  bytes->addOnRejectedListener([promise](const std::exception_ptr& error) { promise->reject(error); });
}

std::shared_ptr<HybridTransformBindingSpec> HybridEngine::createTransformBinding(double entity) {
  requireRenderThread(core_->thread(), "Engine.createTransformBinding()");
  ::filament::TransformManager& transforms = core_->engine().getTransformManager();
  auto instance = requireComponent(transforms, entity, "Engine.createTransformBinding()", "transform");
  auto binding = std::make_shared<TransformBindingCore>(toEntity(entity), Trs::decompose(transforms.getTransform(instance)));
  core_->addTransformBinding(binding);
  return std::make_shared<HybridTransformBinding>(core_, binding);
}

std::shared_ptr<HybridValueBindingSpec> HybridEngine::createValueBinding(double initialValue) {
  return std::make_shared<HybridValueBinding>(core_, initialValue);
}

std::shared_ptr<HybridCameraManipulatorSpec> HybridEngine::createOrbitManipulator(const OrbitManipulatorOptions& options) {
  auto manipulator = std::make_shared<ManipulatorCore>(options);
  core_->thread().post({.run = [core = core_, manipulator] { core->addManipulator(manipulator); }});
  return std::make_shared<HybridCameraManipulator>(core_, manipulator);
}

std::shared_ptr<HybridFrameListenerSubscriptionSpec>
HybridEngine::addOnFrameListener(const std::function<bool(const FrameInfo&)>& listener) {
  requireRenderThread(core_->thread(), "Engine.addOnFrameListener()");
  std::shared_ptr<FrameListener> registered = core_->addFrameListener(listener);
  return std::make_shared<HybridFrameListenerSubscription>(core_, registered);
}

void HybridEngine::requestFrame() {
  core_->requestFrame();
}

std::shared_ptr<Promise<void>> HybridEngine::shutdown() {
  return core_->shutdown();
}

void HybridEngine::dispose() {
  core_->shutdown();
}

const std::shared_ptr<EngineCore>& HybridEngine::core() const {
  return core_;
}

} // namespace margelo::nitro::filament
