#include "EngineCore.hpp"

#include "BackendConversion.hpp"
#include "targets/ViewTargetCore.hpp"
#include "threading/WorkerPool.hpp"

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

void EngineCore::addTarget(std::shared_ptr<ViewTargetCore> target) {
  targets_.push_back(std::move(target));
}

void EngineCore::removeTarget(const std::shared_ptr<ViewTargetCore>& target) {
  std::erase(targets_, target);
  updateDemand();
}

void EngineCore::renderFrame(int64_t frameTimeNanos) {
  frameRequested_ = false;
  for (const std::shared_ptr<ViewTargetCore>& target : targets_) {
    target->render(frameTimeNanos);
  }
  updateDemand();
}

void EngineCore::updateDemand() {
  bool canRender =
      std::any_of(targets_.begin(), targets_.end(), [](const std::shared_ptr<ViewTargetCore>& target) { return target->canRender(); });
  bool wantsFrame = renderMode_ == RenderMode::CONTINUOUS || frameRequested_;
  thread_->setVsyncEnabled(canRender && wantsFrame);
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
  for (const std::shared_ptr<ViewTargetCore>& target : targets_) {
    target->destroy();
  }
  targets_.clear();
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
