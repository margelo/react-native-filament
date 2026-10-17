#include "HybridEngine.hpp"

#include "targets/HybridViewTarget.hpp"
#include "targets/ViewTargetCore.hpp"

#include <stdexcept>

namespace margelo::nitro::filament {

HybridEngine::HybridEngine(std::shared_ptr<EngineCore> core) : HybridObject(TAG), core_(std::move(core)) {}

HybridEngine::~HybridEngine() {
  core_->shutdown();
}

EngineBackend HybridEngine::getBackend() {
  return core_->backend();
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
            engine->core()->addTarget(target);
            promise->resolve(std::make_shared<HybridViewTarget>(engine, target, view));
          },
      .cancel = [promise] { promise->reject(std::make_exception_ptr(std::runtime_error("The Engine was shut down."))); },
  });
  return promise;
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
