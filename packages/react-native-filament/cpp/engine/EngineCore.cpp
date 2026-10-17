#include "EngineCore.hpp"

#include "BackendConversion.hpp"
#include "RenderRuntimeDispatcher.hpp"
#include "targets/ViewTargetCore.hpp"
#include "threading/WorkerPool.hpp"
#include "utils/Logger.hpp"

#include <algorithm>
#include <stdexcept>

namespace margelo::nitro::filament {

std::shared_ptr<EngineCore> EngineCore::create(EngineBackend backend, StartedHandler onStarted) {
  std::shared_ptr<EngineCore> core(new EngineCore(backend));
  core->thread_ = std::make_unique<RenderThread>([raw = core.get()](int64_t frameTimeNanos) { raw->renderFrame(frameTimeNanos); });
  core->thread_->post({
      .run =
          [core, onStarted] {
            core->engine_ = ::filament::Engine::Builder().backend(toFilamentBackend(core->backend_)).build();
            if (core->engine_ == nullptr) {
              onStarted(core, std::make_exception_ptr(
                                  std::runtime_error("Filament could not create an Engine for this backend on this device.")));
              core->shutdown();
              return;
            }
            onStarted(core, nullptr);
          },
      .cancel =
          [core, onStarted] {
            onStarted(core, std::make_exception_ptr(std::runtime_error("The Engine was shut down before it started.")));
          },
  });
  return core;
}

EngineCore::EngineCore(EngineBackend backend) : backend_(backend) {}

EngineBackend EngineCore::backend() const {
  return backend_;
}

RenderThread& EngineCore::thread() {
  return *thread_;
}

::filament::Engine& EngineCore::engine() {
  return *engine_;
}

bool EngineCore::isLive() const {
  return live_;
}

RenderMode EngineCore::renderMode() const {
  return renderMode_;
}

void EngineCore::setRenderMode(RenderMode mode) {
  renderMode_ = mode;
  scheduleDemandUpdate();
}

void EngineCore::requestFrame() {
  frameRequested_ = true;
  scheduleDemandUpdate();
}

void EngineCore::scheduleDemandUpdate() {
  if (demandUpdatePending_.exchange(true)) {
    return;
  }
  thread_->post({.run = [self = shared_from_this()] {
    self->demandUpdatePending_ = false;
    self->updateDemand();
  }});
}

void EngineCore::updateDemand() {
  bool canRender =
      std::any_of(targets_.begin(), targets_.end(), [](const std::shared_ptr<ViewTargetCore>& target) { return target->canRender(); });
  bool wantsFrame = renderMode_ == RenderMode::CONTINUOUS || frameRequested_ || listenersWantFrame_;
  bool enabled = canRender && wantsFrame;
  if (!enabled) {
    lastFrameTimeNanos_ = 0;
  }
  if (enabled != vsyncEnabled_) {
    vsyncEnabled_ = enabled;
    thread_->setVsyncEnabled(enabled);
  }
}

void EngineCore::adopt(const std::shared_ptr<Resource>& resource) {
  resources_->adopt(resource);
}

void EngineCore::dispose(const std::shared_ptr<Resource>& resource) {
  if (!resource->markDisposing()) {
    return;
  }
  thread_->post({.run = [resource] { resource->destroyTree(); }});
}

void EngineCore::addTarget(std::shared_ptr<ViewTargetCore> target) {
  targets_.push_back(std::move(target));
}

void EngineCore::removeTarget(const std::shared_ptr<ViewTargetCore>& target) {
  std::erase(targets_, target);
  updateDemand();
}

void EngineCore::bindRuntime(std::shared_ptr<worklets::WorkletRuntime> runtime) {
  {
    std::unique_lock lock(runtimeMutex_);
    if (runtime_ != nullptr) {
      throw std::runtime_error("This Engine's render thread already has a worklet runtime.");
    }
    runtime_ = runtime;
  }
  auto dispatcher = std::make_shared<RenderRuntimeDispatcher>(weak_from_this(), runtime);
  runtime->runSync([&](jsi::Runtime& rt) { Dispatcher::installRuntimeGlobalDispatcher(rt, dispatcher); });
}

bool EngineCore::hasRuntime() const {
  return runtime() != nullptr;
}

std::shared_ptr<worklets::WorkletRuntime> EngineCore::runtime() const {
  std::unique_lock lock(runtimeMutex_);
  return runtime_;
}

void EngineCore::runWorklet(const std::shared_ptr<worklets::SerializableWorklet>& worklet) {
  std::shared_ptr<worklets::WorkletRuntime> runtime = this->runtime();
  try {
    runtime->runSync([&](jsi::Runtime& rt) { worklet->toJSValue(rt).asObject(rt).asFunction(rt).call(rt); });
  } catch (const std::exception& error) {
    logError(std::string("A render thread job threw: ") + error.what());
  }
}

std::shared_ptr<FrameListener> EngineCore::addFrameListener(std::function<bool(const FrameInfo&)> callback) {
  std::shared_ptr<FrameListener> listener = frameListeners_.add(std::move(callback));
  listenersWantFrame_ = true;
  updateDemand();
  return listener;
}

void EngineCore::removeFrameListener(const std::shared_ptr<FrameListener>& listener) {
  if (std::shared_ptr<worklets::WorkletRuntime> runtime = this->runtime()) {
    runtime->runSync([&](jsi::Runtime&) { frameListeners_.remove(listener); });
  } else {
    frameListeners_.remove(listener);
  }
  if (frameListeners_.empty()) {
    listenersWantFrame_ = false;
    updateDemand();
  }
}

FrameInfo EngineCore::nextFrameInfo(int64_t frameTimeNanos) {
  double deltaSeconds = lastFrameTimeNanos_ == 0 ? 0 : static_cast<double>(frameTimeNanos - lastFrameTimeNanos_) / 1e9;
  lastFrameTimeNanos_ = frameTimeNanos;
  elapsedSeconds_ += deltaSeconds;
  return FrameInfo(static_cast<double>(frameTimeNanos), deltaSeconds, elapsedSeconds_, frameIndex_++);
}

void EngineCore::renderFrame(int64_t frameTimeNanos) {
  frameRequested_ = false;
  FrameInfo frame = nextFrameInfo(frameTimeNanos);
  if (!frameListeners_.empty()) {
    if (std::shared_ptr<worklets::WorkletRuntime> runtime = this->runtime()) {
      listenersWantFrame_ = frameListeners_.dispatch(frame, *runtime);
    }
  }
  for (const std::shared_ptr<ViewTargetCore>& target : targets_) {
    target->render(frameTimeNanos);
  }
  updateDemand();
}

std::shared_ptr<Promise<void>> EngineCore::shutdown() {
  std::unique_lock lock(shutdownMutex_);
  if (shutdownPromise_ != nullptr) {
    return shutdownPromise_;
  }
  shutdownPromise_ = Promise<void>::create();
  live_ = false;
  thread_->post({.run = [self = shared_from_this()] { self->shutdownOnRenderThread(); }});
  return shutdownPromise_;
}

void EngineCore::shutdownOnRenderThread() {
  thread_->close();
  if (std::shared_ptr<worklets::WorkletRuntime> runtime = this->runtime()) {
    runtime->runSync([&](jsi::Runtime&) { frameListeners_.clear(); });
  }
  resources_->markDisposing();
  resources_->destroyTree();
  targets_.clear();
  {
    std::unique_lock lock(runtimeMutex_);
    runtime_ = nullptr;
  }
  if (engine_ != nullptr) {
    ::filament::Engine::destroy(&engine_);
  }
  thread_->setVsyncEnabled(false);
  thread_->quit();
  WorkerPool::shared().post([self = shared_from_this()] {
    self->thread_->join();
    self->shutdownPromise_->resolve();
  });
}

} // namespace margelo::nitro::filament
