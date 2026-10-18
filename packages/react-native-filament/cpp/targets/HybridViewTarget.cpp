#include "HybridViewTarget.hpp"

#include "ViewHostCommands.hpp"
#include "engine/HybridEngine.hpp"
#include "scene/HybridView.hpp"
#include "utils/ThreadChecks.hpp"

#include <future>
#include <stdexcept>

namespace margelo::nitro::filament {

HybridViewTarget::HybridViewTarget(std::shared_ptr<HybridEngine> engine, std::shared_ptr<ViewTargetCore> core,
                                   std::shared_ptr<HybridFilamentViewSpec> view)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)), view_(std::move(view)),
      renderView_(std::make_shared<HybridView>(engine_->core(), core_)) {
  view_->setSurfaceObserver(makeSurfaceObserver(engine_->core(), core_));
}

HybridViewTarget::~HybridViewTarget() {
  dispose();
}

double HybridViewTarget::getWidth() {
  return core_->width();
}

double HybridViewTarget::getHeight() {
  return core_->height();
}

std::shared_ptr<HybridViewSpec> HybridViewTarget::getView() {
  return renderView_;
}

ListenerSubscription HybridViewTarget::addOnFirstFrameListener(const std::function<void()>& listener) {
  core_->requireLive("ViewTarget.addOnFirstFrameListener()");
  return ListenerSubscription(core_->addFirstFrameListener(listener));
}

std::shared_ptr<Promise<std::optional<PickResult>>> HybridViewTarget::pick(double x, double y) {
  core_->requireLive("ViewTarget.pick()");
  auto promise = Promise<std::optional<PickResult>>::create();
  const std::shared_ptr<EngineCore>& engine = engine_->core();
  engine->thread().post({
      .run =
          [engine, core = core_, promise, x, y] {
            if (!core->isLive()) {
              promise->reject(std::make_exception_ptr(
                  std::runtime_error("FilamentDisposedError: ViewTarget.pick() was called on a disposed ViewTarget.")));
              return;
            }
            core->pick(x, y, promise);
            engine->requestFrame();
          },
      .cancel = [promise] { promise->reject(std::make_exception_ptr(std::runtime_error("The Engine was shut down."))); },
  });
  return promise;
}

std::shared_ptr<Promise<std::shared_ptr<HybridSnapshotSpec>>> HybridViewTarget::takeSnapshot() {
  core_->requireLive("ViewTarget.takeSnapshot()");
  auto promise = Promise<std::shared_ptr<HybridSnapshotSpec>>::create();
  const std::shared_ptr<EngineCore>& engine = engine_->core();
  engine->thread().post({
      .run =
          [engine, core = core_, promise] {
            if (!core->isLive()) {
              promise->reject(std::make_exception_ptr(
                  std::runtime_error("FilamentDisposedError: ViewTarget.takeSnapshot() was called on a disposed ViewTarget.")));
              return;
            }
            core->takeSnapshot(promise);
            engine->requestFrame();
          },
      .cancel = [promise] { promise->reject(std::make_exception_ptr(std::runtime_error("The Engine was shut down."))); },
  });
  return promise;
}

ListenerSubscription HybridViewTarget::addOnResizeListener(const std::function<void(double width, double height)>& listener) {
  core_->requireLive("ViewTarget.addOnResizeListener()");
  return ListenerSubscription(core_->addResizeListener(listener));
}

void HybridViewTarget::setScene(const std::shared_ptr<HybridSceneSpec>& scene) {
  requireRenderThread(engine_->core()->thread(), "ViewTarget.setScene()");
  setHostScene(*core_, *engine_->core(), scene, "ViewTarget.setScene()");
}

void HybridViewTarget::setCamera(const std::shared_ptr<HybridCameraSpec>& camera) {
  requireRenderThread(engine_->core()->thread(), "ViewTarget.setCamera()");
  setHostCamera(*core_, *engine_->core(), camera, "ViewTarget.setCamera()");
}

void HybridViewTarget::setClearOptions(const ClearOptions& options) {
  requireRenderThread(engine_->core()->thread(), "ViewTarget.setClearOptions()");
  core_->requireLive("ViewTarget.setClearOptions()");
  core_->setClearOptions(toClearSettings(options));
}

void HybridViewTarget::dispose() {
  if (disposed_.exchange(true)) {
    return;
  }
  view_->setSurfaceObserver(std::nullopt);
  const std::shared_ptr<EngineCore>& engine = engine_->core();
  if (!core_->markDisposing()) {
    return;
  }
  engine->thread().post({.run = [engine, core = core_] {
    engine->removeTarget(core);
    core->destroyTree();
  }});
}

SurfaceObserver HybridViewTarget::makeSurfaceObserver(std::weak_ptr<EngineCore> weakEngine, std::weak_ptr<ViewTargetCore> weakTarget) {
  auto onCreated = [weakEngine, weakTarget](const std::shared_ptr<HybridNativeSurfaceSpec>& surface) {
    std::shared_ptr<EngineCore> engine = weakEngine.lock();
    if (engine == nullptr) {
      surface->release();
      return;
    }
    engine->thread().post({
        .run =
            [engine, weakTarget, surface] {
              std::shared_ptr<ViewTargetCore> target = weakTarget.lock();
              if (target == nullptr) {
                surface->release();
                return;
              }
              target->attach(surface);
              engine->updateDemand();
            },
        .cancel = [surface] { surface->release(); },
    });
  };

  auto onResized = [weakEngine, weakTarget](const std::shared_ptr<HybridNativeSurfaceSpec>& surface) {
    std::shared_ptr<EngineCore> engine = weakEngine.lock();
    if (engine == nullptr) {
      return;
    }
    engine->thread().post({.run = [engine, weakTarget, surface] {
      if (std::shared_ptr<ViewTargetCore> target = weakTarget.lock()) {
        target->resize(surface);
        engine->updateDemand();
      }
    }});
  };

  auto onDestroyed = [weakEngine, weakTarget](const std::shared_ptr<HybridNativeSurfaceSpec>& surface) {
    std::shared_ptr<EngineCore> engine = weakEngine.lock();
    std::shared_ptr<ViewTargetCore> target = weakTarget.lock();
    if (engine == nullptr || target == nullptr) {
      surface->release();
      return;
    }
    bool synchronous = surface->getSynchronousTeardown();
    if (synchronous) {
      target->revoke();
    }
    auto released = std::make_shared<std::promise<void>>();
    engine->thread().postFront({
        .run =
            [engine, target, surface, released] {
              target->detach(surface);
              engine->updateDemand();
              released->set_value();
            },
        .cancel =
            [surface, released] {
              surface->release();
              released->set_value();
            },
    });
    if (synchronous) {
      released->get_future().wait();
    }
  };

  return SurfaceObserver(onCreated, onResized, onDestroyed);
}

} // namespace margelo::nitro::filament
