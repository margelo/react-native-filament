#include "HybridEngine.hpp"

#include "HybridFrameListenerSubscription.hpp"
#include "HybridRenderThread.hpp"
#include "scene/HybridCamera.hpp"
#include "scene/HybridScene.hpp"
#include "scene/HybridSkybox.hpp"
#include "utils/ThreadChecks.hpp"

#include "targets/HybridViewTarget.hpp"
#include "targets/ViewTargetCore.hpp"

#include <stdexcept>

namespace margelo::nitro::filament {

HybridEngine::HybridEngine(std::shared_ptr<EngineCore> core)
    : HybridObject(TAG), core_(std::move(core)), renderThread_(std::make_shared<HybridRenderThread>(core_)) {}

HybridEngine::~HybridEngine() {
  core_->shutdown();
}

EngineBackend HybridEngine::getBackend() {
  return core_->backend();
}

std::shared_ptr<HybridRenderThreadSpec> HybridEngine::getRenderThread() {
  return renderThread_;
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
  auto [r, g, b, a] = options.clearColor.value_or(std::make_tuple(0.0, 0.0, 0.0, 0.0));
  std::array<float, 4> clearColor{static_cast<float>(r), static_cast<float>(g), static_cast<float>(b), static_cast<float>(a)};
  auto engine = shared_cast<HybridEngine>();
  core_->thread().post({
      .run =
          [engine, view, clearColor, promise] {
            auto target = std::make_shared<ViewTargetCore>(engine->core()->engine(), clearColor);
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
