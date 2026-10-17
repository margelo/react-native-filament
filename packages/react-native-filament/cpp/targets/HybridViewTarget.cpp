#include "HybridViewTarget.hpp"

#include "engine/HybridEngine.hpp"
#include "utils/ThreadChecks.hpp"

#include <future>

namespace margelo::nitro::filament {

HybridViewTarget::HybridViewTarget(std::shared_ptr<HybridEngine> engine, std::shared_ptr<ViewTargetCore> core,
                                   std::shared_ptr<HybridFilamentViewSpec> view)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)), view_(std::move(view)) {
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

void HybridViewTarget::setClearColor(const std::tuple<double, double, double, double>& color) {
  requireRenderThread(engine_->core()->thread(), "ViewTarget.setClearColor()");
  auto [r, g, b, a] = color;
  core_->setClearColor({static_cast<float>(r), static_cast<float>(g), static_cast<float>(b), static_cast<float>(a)});
}

void HybridViewTarget::dispose() {
  if (disposed_.exchange(true)) {
    return;
  }
  view_->setSurfaceObserver(std::nullopt);
  const std::shared_ptr<EngineCore>& engine = engine_->core();
  engine->thread().post({.run = [engine, core = core_] {
    engine->removeTarget(core);
    core->destroy();
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
